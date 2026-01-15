export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    tier: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    tier?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    tier?: string
                }
            }
            income_settings: {
                Row: {
                    user_id: string
                    monthly_amount: number
                    currency: string
                }
                Insert: {
                    user_id: string
                    monthly_amount: number
                    currency?: string
                }
                Update: {
                    user_id?: string
                    monthly_amount?: number
                    currency?: string
                }
            }
            accounts: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    balance: number
                    include_in_available: boolean
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    balance: number
                    include_in_available?: boolean
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    balance?: number
                    include_in_available?: boolean
                }
            }
            expenses: {
                Row: {
                    id: string
                    user_id: string
                    amount: number
                    category: string
                    merchant_name: string
                    date: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    amount: number
                    category: string
                    merchant_name: string
                    date: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    amount?: number
                    category?: string
                    merchant_name?: string
                    date?: string
                }
            }
            subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    amount: number
                    category: string
                    next_billing_date: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    amount: number
                    category: string
                    next_billing_date: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    amount?: number
                    category?: string
                    next_billing_date?: string
                }
            }
        }
    }
}
