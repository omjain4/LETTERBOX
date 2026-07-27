import React, { useEffect, useState } from 'react';

export default function CurtainLoader({ isLoading }: { isLoading: boolean }) {
    const [render, setRender] = useState(isLoading);

    useEffect(() => {
        if (!isLoading) {
            const timeout = setTimeout(() => setRender(false), 1200); // Wait for transition
            return () => clearTimeout(timeout);
        } else {
            setRender(true);
        }
    }, [isLoading]);

    if (!render) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            pointerEvents: isLoading ? 'all' : 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            // Deep red velvet base
            backgroundColor: '#8a0a19',
            // Theater curtain folds using a linear gradient overlay
            backgroundImage: `
                linear-gradient(to right, 
                    rgba(0,0,0,0.5) 0%, 
                    transparent 15%, 
                    transparent 35%, 
                    rgba(0,0,0,0.5) 50%,
                    transparent 65%, 
                    transparent 85%, 
                    rgba(0,0,0,0.5) 100%
                )
            `,
            backgroundSize: '15vw 100%',
            transform: isLoading ? 'translateY(0)' : 'translateY(-100vh)',
            transition: 'transform 1s cubic-bezier(0.75, 0, 0.25, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
        }}>
            {/* The Logo / Text in the middle */}
            <div style={{
                transition: 'opacity 0.3s ease',
                opacity: isLoading ? 1 : 0,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
            }}>
                <img
                    src="/mosiac-logo.png"
                    alt="MOSIAC"
                    style={{
                        width: 80,
                        height: 80,
                        objectFit: 'contain',
                        filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.5))',
                        animation: 'pulse 2s infinite ease-in-out'
                    }}
                />
                <h1 style={{
                    color: '#f9d976',
                    fontFamily: 'var(--font-display)',
                    fontSize: '3rem',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    margin: 0,
                    textShadow: '0 5px 15px rgba(0,0,0,0.8)',
                    animation: 'pulse 2s infinite ease-in-out'
                }}>
                    MOSIAC
                </h1>
            </div>

            {/* Gold fringe trim at the bottom edge */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3vh',
                minHeight: '20px',
                background: 'linear-gradient(to bottom, #f9d976 0%, #e9b646 40%, #c4962c 60%, #8c6812 100%)',
                boxShadow: '0 -2px 15px rgba(0,0,0,0.6)',
                borderBottom: '4px solid #5a4106'
            }}>
                {/* Fringe tassels effect using repeating radial gradient */}
                <div style={{
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    right: 0,
                    height: 8,
                    backgroundImage: 'radial-gradient(circle at 50% 0%, #c4962c 40%, transparent 41%)',
                    backgroundSize: '12px 100%',
                }} />
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}
