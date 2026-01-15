export const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern)
    }
}

export const haptic = {
    success: () => vibrate([10, 30, 10]),
    error: () => vibrate([50, 50, 50]),
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(40),
}
