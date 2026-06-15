import React, { useState } from "react";
import { avior } from "../Api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardContent, CardTitle, CardDescription } from "@/Components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import RideForm from "../Components/pagesComp/sendride/RideForm";
import SuccessNotification from "../Components/pagesComp/sendride/SuccessNotification";
import { useAppData } from "../context/useAppData";

export default function SendRide() {
    const { user, session } = useAppData();
    // user יציב ב-mount (ProtectedRoute מבטיח את זה) — lazy init במקום useEffect.
    const [driverName, setDriverName] = useState(`${user.firstName} ${user.lastName}`);
    const [location, setLocation] = useState("");
    const [destination, setDestination] = useState("");
    const [seats, setSeats] = useState(4);
    const [departureTime, setDepartureTime] = useState(new Date());
    const [type, setType] = useState('offer');
    const [showSuccess, setShowSuccess] = useState(false);

    const queryClient = useQueryClient();

    const createRideMutation = useMutation({
        mutationFn: async (rideData) => {
            if (!user || !user.id) {
                throw new Error("User not identified");
            }
            // שולחים לשרת את התאריך המדויק שנבחר
            // (המשתמש בחר תאריך ושעה בטופס, והם נשמרים ב-departure_time)
            return await avior.entities.Ride.create({
                driver_name: rideData.driver_name,
                location: rideData.location,       // שים לב: אנחנו שולחים location
                destination: rideData.destination,
                departure_time: rideData.departure_time.toISOString(),
                seats: rideData.seats, // ברירת מחדל
                type: rideData.type,
            }, session);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            setShowSuccess(true);
            // איפוס חלקי (משאירים את השם)
            setLocation("");
            setDestination("");
            setDepartureTime(new Date()); // איפוס לשעה הנוכחית

            setTimeout(() => setShowSuccess(false), 3000);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!driverName.trim() || !location.trim() || !destination.trim() || !seats) {
            toast.error("נא למלא את כל השדות");
            return;
        }

        createRideMutation.mutate({
            driver_name: driverName,
            location: location,
            destination: destination,
            seats: seats,
            departure_time: departureTime,
            type,
        });
    };

    return (
        <div className="h-full flex items-start justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md md:max-w-2xl"
            >
                <div className="space-y-1 pt-2 px-6">
                    <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        טרמפיקציה
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        שתף נסיעה עם הקהילה
                    </CardDescription>
                </div>

                <CardContent className="pt-2 px-6">
                    <RideForm
                        user={user} // העברת המשתמש לטופס
                        driverName={driverName}
                        setDriverName={setDriverName}
                        location={location}
                        setLocation={setLocation}
                        destination={destination}
                        setDestination={setDestination}
                        seats={seats}
                        setSeats={setSeats}
                        departureTime={departureTime}
                        setDepartureTime={setDepartureTime}
                        type={type}
                        setType={setType}
                        onSubmit={handleSubmit}
                        isSubmitting={createRideMutation.isPending}
                    />
                </CardContent>
                <SuccessNotification isVisible={showSuccess} />
            </motion.div>
        </div>
    );
}