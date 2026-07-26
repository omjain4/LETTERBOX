import { useEffect } from 'react'

interface ConfirmModalProps {
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
            if (e.key === 'Enter') onConfirm()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onConfirm, onCancel])

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fadeIn 0.15s ease'
        }} onClick={onCancel}>
            <div style={{
                background: 'var(--color-bg-card)',
                border: '3px solid var(--color-border)',
                boxShadow: '6px 6px 0px var(--color-border)',
                padding: '32px',
                maxWidth: 400,
                width: '90%',
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{
                    fontSize: '1.1rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    marginBottom: 12, color: 'var(--color-text)'
                }}>
                    {title}
                </h3>
                <p style={{
                    color: 'var(--color-text-muted)', fontSize: '0.9rem',
                    lineHeight: 1.6, marginBottom: 28
                }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        className="btn btn-outline"
                        style={{ padding: '10px 24px', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 24px', fontSize: '0.85rem', fontWeight: 700,
                            background: '#dc2626', color: 'white', border: '2px solid #991b1b',
                            boxShadow: '3px 3px 0px #991b1b', cursor: 'pointer',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            transition: 'all 0.1s ease'
                        }}
                        onMouseDown={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(2px, 2px)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '1px 1px 0px #991b1b';
                        }}
                        onMouseUp={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(0,0)';
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '3px 3px 0px #991b1b';
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    )
}
