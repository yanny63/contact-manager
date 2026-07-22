import { useEffect, useState } from "react";

export function useForceUpdate(interval: number = 30000) {
    const [ , setTick ] = useState(0)
    useEffect(() => {
        const intervalFunc = setInterval(() => {
            setTick((t) => t + 1)
        }, interval)
        return () => clearInterval(intervalFunc)
    }, [interval])
}