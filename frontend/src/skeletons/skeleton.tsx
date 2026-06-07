export default function Skeleton({ width = '100%', height = 'clamp(20px, 20vh, 40px)', circle = false, padding = ''}) {
    return (
        <div style={{ 
            width: width, height: height, borderRadius: circle ? '50%' : 4, padding: padding}} className="skeleton">
        </div>
    )
}