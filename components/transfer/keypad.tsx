"use client";

import { Delete, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KeypadProps {
    onKeyPress: (key: string) => void;
    onDelete: () => void;
    onConfirm: () => void;
    isValid: boolean;
}

export function Keypad({ onKeyPress, onDelete, onConfirm, isValid }: KeypadProps) {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

    return (
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mx-auto p-4">
            {keys.map((key) => (
                <motion.button
                    key={key}
                    whileTap={{ scale: 0.9, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    onClick={() => onKeyPress(key)}
                    className="h-20 rounded-full text-2xl font-medium text-white flex items-center justify-center hover:bg-white/5 transition-colors focus:outline-none"
                >
                    {key}
                </motion.button>
            ))}
            <motion.button
                whileTap={{ scale: 0.9, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                onClick={onDelete}
                className="h-20 rounded-full flex items-center justify-center text-white hover:bg-white/5 transition-colors focus:outline-none"
            >
                <Delete className="w-8 h-8 opacity-70" />
            </motion.button>

            {/* Confirm Button spans full width of bottom or just occupies last slot? 
          Design choice: Keypad usually 3x4. 
          Let's place Confirm separate or in the grid?
          If in grid, the last row is usually . 0 Delete
      */}
        </div>
    );
}
