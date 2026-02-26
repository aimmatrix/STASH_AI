import { Stack } from 'expo-router';
import React from 'react';
import { RoadmapScreen } from '../components/RoadmapScreen';

export default function RoadmapPage() {
    return (
        <>
            <Stack.Screen options={{
                headerShown: false,
            }} />
            <RoadmapScreen />
        </>
    );
}
