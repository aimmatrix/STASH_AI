
export function getDaysLeftInMonth(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    // Day 0 of next month is the last day of current month
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    return lastDayOfMonth - currentDay + 1;
}

export function calculateSafeToSpend(totalBalance: number, lockedAmount: number): number {
    const daysLeft = getDaysLeftInMonth();
    if (daysLeft <= 0) return 0;
    const available = totalBalance - lockedAmount;
    return available > 0 ? available / daysLeft : 0;
}
