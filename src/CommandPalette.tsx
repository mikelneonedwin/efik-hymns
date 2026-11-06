import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { hymnsData } from "./hymnData";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function normalize(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = new Uint16Array(n + 1);
    let curr = new Uint16Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        const ca = a.charCodeAt(i - 1);
        for (let j = 1; j <= n; j++) {
            const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost
            );
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

function scoreHymn(query: string, hymn: { number: number; firstLine: string }): number | null {
    const rawQ = query.trim().toLowerCase();
    const numStr = String(hymn.number);

    // Exact or prefix match on hymn number
    if (numStr === rawQ) return 1000;
    if (numStr.startsWith(rawQ)) return 900;

    const normQ = normalize(query);
    if (!normQ) return null;

    const normTarget = normalize(hymn.firstLine);

    // Exact or prefix on full normalized lyrics
    if (normTarget === normQ) return 850;
    if (normTarget.startsWith(normQ)) return 750;
    if (normTarget.includes(normQ)) return 650;

    // Substring window fuzzy matching on normalized lyrics
    const qLen = normQ.length;
    const tLen = normTarget.length;
    let bestWindowDist = Infinity;

    if (tLen >= qLen) {
        for (let len = Math.max(1, qLen - 2); len <= qLen + 2; len++) {
            for (let i = 0; i + len <= tLen; i++) {
                const sub = normTarget.slice(i, i + len);
                const d = levenshtein(normQ, sub);
                if (d < bestWindowDist) {
                    bestWindowDist = d;
                    if (bestWindowDist === 0) break;
                }
            }
            if (bestWindowDist === 0) break;
        }
    } else {
        bestWindowDist = levenshtein(normQ, normTarget);
    }

    const windowSimilarity = Math.max(0, (qLen - bestWindowDist) / qLen);

    // Word token level fuzzy matching
    const qTokens = query.toLowerCase().split(/[^\w]+/).filter(Boolean);
    const targetTokens = hymn.firstLine.toLowerCase().split(/[^\w]+/).filter(Boolean);

    let tokenScore = 0;
    for (const qWord of qTokens) {
        let bestWordDist = Infinity;
        for (const tWord of targetTokens) {
            const d = levenshtein(qWord, tWord);
            if (d < bestWordDist) bestWordDist = d;
        }
        const wLen = qWord.length;
        const maxAllowed = wLen <= 3 ? 1 : wLen <= 6 ? 2 : 3;
        if (bestWordDist <= maxAllowed) {
            tokenScore += (wLen - bestWordDist) / wLen;
        }
    }

    const tokenRatio = qTokens.length > 0 ? tokenScore / qTokens.length : 0;
    const overallScore = Math.max(windowSimilarity, tokenRatio);

    if (overallScore >= 0.45) {
        return overallScore * 500;
    }

    return null;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) {
            setSearch("");
        }
    }, [open]);

    const filteredHymns = useMemo(() => {
        const trimmed = search.trim();
        if (!trimmed) {
            return hymnsData;
        }

        const scored = hymnsData
            .map((hymn) => ({ hymn, score: scoreHymn(trimmed, hymn) }))
            .filter((item): item is { hymn: (typeof hymnsData)[0]; score: number } => item.score !== null)
            .sort((a, b) => b.score - a.score);

        return scored.map((item) => item.hymn);
    }, [search]);

    if (!open) return null;

    function handleSelect(hymnNumber: number) {
        navigate(`/${hymnNumber}`);
        onOpenChange(false);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] bg-black/75 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="w-[90vw] max-w-[50rem] overflow-hidden rounded-[0.4rem] bg-white shadow-2xl border border-gray-200 text-left text-gray-900 leading-normal"
                onClick={(e) => e.stopPropagation()}
            >
                <Command
                    label="Search Hymns"
                    shouldFilter={false}
                    className="flex flex-col"
                >
                    <div className="flex items-center border-b border-gray-200 px-[0.6rem] py-[0.4rem]">
                        <svg
                            className="mr-[0.4rem] h-[0.7rem] w-[0.7rem] text-gray-400 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <Command.Input
                            autoFocus
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Search hymns by number or lyric..."
                            className="w-full bg-transparent !text-[0.6rem] text-gray-900 placeholder-gray-400 outline-none font-medium leading-none"
                        />
                    </div>

                    <Command.List className="max-h-[65vh] overflow-y-auto p-[0.3rem] scroll-smooth">
                        {filteredHymns.length === 0 ? (
                            <Command.Empty className="py-[0.8rem] text-center !text-[0.4rem] text-gray-500">
                                No hymns found.
                            </Command.Empty>
                        ) : (
                            <Command.Group>
                                {filteredHymns.map((hymn) => (
                                    <Command.Item
                                        key={hymn.number}
                                        value={`${hymn.number} ${hymn.firstLine}`}
                                        onSelect={() => handleSelect(hymn.number)}
                                        className="flex cursor-pointer items-center gap-[0.4rem] rounded-[0.2rem] px-[0.4rem] py-[0.3rem] !text-[0.45rem] text-gray-800 transition-colors aria-selected:bg-blue-600 aria-selected:text-white"
                                    >
                                        <span className="inline-flex min-w-[1.2rem] items-center justify-center rounded-[0.15rem] bg-gray-100 px-[0.25rem] py-[0.1rem] !text-[0.35rem] font-bold text-gray-700 aria-selected:bg-blue-500 aria-selected:text-white shrink-0">
                                            {hymn.number}
                                        </span>
                                        <span className="truncate font-medium">
                                            {hymn.firstLine}
                                        </span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
