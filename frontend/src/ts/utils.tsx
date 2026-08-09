import { useEffect, useState } from "react";
import { formatPhoneNumberIntl } from 'react-phone-number-input'

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
    isSpan?: boolean
    intervalSeconds?: number
}

export function AnimateText({ text, className = '', isSpan = true, intervalSeconds = 300 }: AnimateTextProps) {
    const [ animatedText, setAnimatedText ] = useState<string>('')

    useEffect(() => {
        let index = 0;

        const interval = setInterval(() => {
            setAnimatedText(text.slice(0, index + 1))
            index++

            if (index === text.length) {
                clearInterval(interval)
            }
        }, intervalSeconds)

        

        return () => clearInterval(interval)
    }, [])

    return (
        isSpan ? <span className={className}>{animatedText}</span> : <div className={className}>{animatedText}</div>
    )
}

export function formatTime(isotime: string) {
    const date = new Date(isotime)
    const now = new Date()

    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "przed chwilą"
    if (diffMin < 60) return `${diffMin} min temu`
    if (diffHour < 24) return `${diffHour} godz. temu`
    if (diffDay < 7) {
        if (diffDay === 1) return `${diffDay} dzień temu`
        return `${diffDay} dni temu`
    }

    return date.toLocaleTimeString([], { day: 'numeric', month: 'short' })
}

export function formatName(name: string) {
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts.at(-1)[0]}.`
}

export function formatNumber(prefix: string, phone: string) {
    const number = `+${prefix}${phone}`
    return formatPhoneNumberIntl(number)
}

interface AvatarPerson {
  nickname: string | null;
  phone: string;
  prefix: string;
}

const colors = [
  "#4F6EF7", "#E05A5A", "#2AAA8A", "#D4823A",
  "#9B59B6", "#1A7FC1", "#27AE60", "#C0392B",
]

function getInitials(name: string): string {
  if (!name?.trim()) return "?";

  const parts = name.trim().split(" ").filter(Boolean);
  if (parts[0].startsWith("+")) return "#";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts.at(-1)![0]).toUpperCase();
}

function getColor(name: string | null): string {
  if (!name) return colors[0];

  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

export function Avatar({ user, size = 40 }: { user: AvatarPerson | null; size?: number }) {
  if (!user) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        ?
      </div>
    );
  }

  const label = user.nickname
    ? getInitials(user.nickname)
    : `+${user.prefix}`;
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: getColor(user.nickname ?? user.phone),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 500,
        color: "#fff",
      }}
    >
      {label}
    </div>
  );
}