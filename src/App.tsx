/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CommandPalette } from "./CommandPalette";

// form is globally accessible
declare const hymnForm: HTMLFormElement & {
    hymn: HTMLInputElement
}

function App() {

    const location = useLocation();
    const navigateTo = useNavigate();
    const div = useRef<HTMLDivElement>(null)
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const isPaletteOpenRef = useRef(false);
    isPaletteOpenRef.current = isPaletteOpen;

    const elements: HTMLElement[] = [];
    const hymn = location.pathname.match(/[^/]+$/)?.[0];

    useEffect(() => {

        if (!div.current) return;

        // get all the parts of the new hymn
        elements.push(...Array.from(div.current.children) as HTMLElement[])

        window.scroll({ top: 0 }) // this is necessary

        // scroll to the next part of the hymn
        function next() {
            if (isPaletteOpenRef.current) return;
            window.scrollTo({
                behavior: "smooth",
                // extract first items in the list
                top: elements.shift()?.offsetTop
            })
        }

        // enable accesibility features
        window.onclick = (e) => {
            if (isPaletteOpenRef.current) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("button") || target?.closest("form")) return;
            next();
        };

        window.onkeydown = (ev) => {

            if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
                ev.preventDefault();
                setIsPaletteOpen((prev) => !prev);
                return;
            }

            if (isPaletteOpenRef.current) {
                if (ev.key === "Escape") {
                    setIsPaletteOpen(false);
                }
                return;
            }

            // don't fire on an input element
            if (ev.target instanceof HTMLInputElement) return;

            // scroll to next part of hymn
            if (ev.code === "Enter") {
                ev.preventDefault()
                return next()
            }

            // reveal text input to change hymn
            if (ev.code === "Space") {
                ev.preventDefault()
                hymnForm.reset()
                hymnForm.classList.remove("hidden")
                hymnForm.hymn.focus()
            }

        }

    }, [location])

    // change hymn based on input value
    function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
        ev.preventDefault()
        const hymnIndex = hymnForm.hymn.value;
        navigateTo('/' + hymnIndex)
        hymnForm.classList.add("hidden")
    }

    return (
        <>
            <h1>Hymn {hymn}</h1>
            <div
                ref={div}
                id="outlet"
            >
                <Outlet />
            </div>
            <form
                name="hymnForm"
                className="hidden"
                onSubmit={handleSubmit}
            >
                <input
                    name="hymn"
                    type="number"
                />
            </form>

            <CommandPalette
                open={isPaletteOpen}
                onOpenChange={setIsPaletteOpen}
            />
        </>
    )
}

export default App
