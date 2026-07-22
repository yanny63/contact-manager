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

interface AnimateTextProps {
    text: string
    className?: string
    isSpan?: true
}

export function AnimateText({ text, className = '', isSpan = true }: AnimateTextProps) {
    const [ animatedText, setAnimatedText ] = useState<string>('')

    useEffect(() => {
        let index = 0;

        const interval = setInterval(() => {
            setAnimatedText(text.slice(0, index + 1))
            index++

            if (index === text.length) {
                clearInterval(interval)
            }
        }, 300)

        

        return () => clearInterval(interval)
    }, [])

    return (
        isSpan ? <span className={className}>{animatedText}</span> : <div className={className}>{animatedText}</div>
    )
}