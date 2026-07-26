import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyActivityHeatmapProps {
    activityData: Record<string, number>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthlyActivityHeatmap({ activityData }: MonthlyActivityHeatmapProps) {
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    function prevMonth() {
        setCurrentDate(new Date(year, month - 1, 1));
    }

    function nextMonth() {
        setCurrentDate(new Date(year, month + 1, 1));
    }

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // To make it look like GitHub, we want rows (0-6) for Sun-Sat, and columns for weeks.
    // Start date is the Sunday of the week containing the 1st.
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End date is the Saturday of the week containing the end of the month.
    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    // Generate grid matrix: [row][col]
    const grid: { date: Date; dateStr: string; inMonth: boolean; count: number }[][] = Array.from({ length: 7 }, () => []);

    let curr = new Date(startDate);
    let col = 0;
    while (curr <= endDate) {
        const row = curr.getDay(); // 0 to 6
        const dateStr = curr.toISOString().split("T")[0];

        grid[row][col] = {
            date: new Date(curr),
            dateStr,
            inMonth: curr.getMonth() === month,
            count: activityData?.[dateStr] || 0
        };

        curr.setDate(curr.getDate() + 1);
        if (curr.getDay() === 0) {
            col++;
        }
    }

    function getColor(count: number, inMonth: boolean) {
        if (!inMonth) return 'transparent'; // Hide days outside this month completely? Or dim them. Let's make them transparent so it strictly looks like a monthly block.
        if (count === 0) return 'var(--color-bg-elevated)'; // Empty block
        if (count === 1) return '#0e4429';
        if (count === 2) return '#006d32';
        if (count === 3) return '#26a641';
        return '#39d353';
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Calculate total contributions for this month
    let monthTotal = 0;
    for (const r of grid) {
        for (const c of r) {
            if (c?.inMonth) {
                monthTotal += c.count;
            }
        }
    }

    return (
        <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                ACTIVITY HEATMAP
            </h2>

            <div style={{
                background: 'var(--color-bg-card)',
                border: '3px solid var(--color-border)',
                padding: '24px',
                boxShadow: '4px 4px 0px var(--color-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {monthTotal} contributions in {monthName.split(" ")[0]}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={prevMonth} className="btn btn-outline" style={{ padding: '8px 12px' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <div style={{ padding: '8px 16px', background: 'var(--color-bg-dark)', color: 'white', fontWeight: 700 }}>
                            {monthName}
                        </div>
                        <button onClick={nextMonth} className="btn btn-outline" style={{ padding: '8px 12px' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Heatmap Grid - Responsive scrolling container */}
                <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
                        {/* Y-Axis Labels */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginRight: 8, marginTop: 2 }}>
                            {WEEKDAYS.map((w, i) => (
                                <div key={w} style={{ height: 16, fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: '16px', display: 'flex', alignItems: 'center' }}>
                                    {i % 2 !== 0 ? w : ''}
                                </div>
                            ))}
                        </div>

                        {/* Grid Columns */}
                        {Array.from({ length: grid[0].length }).map((_, cIndex) => (
                            <div key={cIndex} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {Array.from({ length: 7 }).map((_, rIndex) => {
                                    const cell = grid[rIndex][cIndex];
                                    if (!cell) return <div key={rIndex} style={{ width: 16, height: 16 }} />;

                                    return (
                                        <div
                                            key={rIndex}
                                            title={`${cell.count} logs on ${cell.dateStr}`}
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: 2, // Slight border radius matches github
                                                backgroundColor: getColor(cell.count, cell.inMonth),
                                                border: cell.inMonth && cell.count === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
