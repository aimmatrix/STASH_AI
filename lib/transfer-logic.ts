
export interface MockUser {
    id: string;
    name: string;
    avatar?: string;
}

export const MOCK_FRIENDS: MockUser[] = [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Charlie" },
];

export async function performTransfer(amount: number, fromPotId: string | null, toPotId: string | null) {
    // In a real app, this would call a Supabase RPC or API route.
    // For v1 visual build, we'll simulate a delay.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
}

export async function splitBill(transactionId: string, amount: number, selectedFriendIds: string[]) {
    // Simulate splitting logic
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const splitAmount = amount / (selectedFriendIds.length + 1); // +1 for self
    return { success: true, splitAmount };
}
