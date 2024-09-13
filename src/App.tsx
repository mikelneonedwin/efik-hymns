/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

// form is globally accessible
declare const hymnForm: HTMLFormElement & {
    hymn: HTMLInputElement
}

function App() {

    const location = useLocation();
    const navigateTo = useNavigate();
    const div = useRef<HTMLDivElement>(null)

    const elements: HTMLElement[] = [];
    const hymn = location.pathname.match(/[^/].+$/)?.[0];

    useEffect(() => {

        if (!div.current) return;

        // get all the parts of the new hymn
        elements.push(...Array.from(div.current.children) as HTMLElement[])

        window.scroll({ top: 0 }) // this is necessary

        // scroll to the next part of the hymn
        function next() {
            window.scrollTo({
                behavior: "smooth",
                // extract first items in the list
                top: elements.shift()?.offsetTop
            })
        }

        // enable accesibility features
        window.onclick = next;
        window.onkeydown = (ev) => {

            console.log(ev)

            // don't fire on an iput element
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
        </>
    )
}

export default App
