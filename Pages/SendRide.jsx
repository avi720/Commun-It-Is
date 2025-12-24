import React, { useState } from "react";
import { base44 } from "../Api/Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Car } from "lucide-react";
import { motion } from "framer-motion";
import RideForm from "../Components/sendride/RideForm";
import SuccessNotification from "../Components/sendride/SuccessNotification";

export default function SendRide() {
    const [driverName, setDriverName] = useState("");
    const [destination, setDestination] = useState("");
    const [departureMinutes, setDepartureMinutes] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    const queryClient = useQueryClient();

    const createRideMutation = useMutation({
        mutationFn: async (rideData) => {
            const departureTime = new Date();
            departureTime.setMinutes(departureTime.getMinutes() + rideData.departure_minutes);

            return await base44.entities.Ride.create({
                ...rideData,
                departure_time: departureTime.toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            setShowSuccess(true);
            setDriverName("");
            setDestination("");
            setDepartureMinutes(0);

            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!driverName.trim() || !destination.trim()) {
            return;
        }

        createRideMutation.mutate({
            driver_name: driverName,
            destination: destination,
            departure_minutes: departureMinutes
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <Card className="shadow-2xl border-none bg-white/95 backdrop-blur">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                <Car className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-bold text-center text-slate-800">
                            טרמפיקציה
                        </CardTitle>
                        <CardDescription className="text-center text-lg text-slate-600 translate-y-2">
                            שתף נסיעה עם הקהילה
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <RideForm
                            driverName={driverName}
                            setDriverName={setDriverName}
                            destination={destination}
                            setDestination={setDestination}
                            departureMinutes={departureMinutes}
                            setDepartureMinutes={setDepartureMinutes}
                            onSubmit={handleSubmit}
                            isSubmitting={createRideMutation.isPending}
                        />
                    </CardContent>
                </Card>

                <SuccessNotification isVisible={showSuccess} />
            </motion.div>
        </div>
    );
}