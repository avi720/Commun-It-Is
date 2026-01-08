import React, { useState, useEffect } from "react";
import { avior } from "../Api/Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardContent, CardTitle, CardDescription } from "@/Components/ui/card";
import { motion } from "framer-motion";
import RideForm from "../Components/pagesComp/sendride/RideForm";
import SuccessNotification from "../Components/pagesComp/sendride/SuccessNotification";
import { useAppData } from "../context/AppContext";

export default function SendRide() {
    // State למשתמש המחובר
    //const [user, setUser] = useState(null);
    const { user } = useAppData();
    // State לטופס
    const [driverName, setDriverName] = useState("");
    useEffect(() => {
        setDriverName(`${user.firstName} ${user.lastName}`);
    }, [user]);
    const [location, setLocation] = useState("");
    const [destination, setDestination] = useState("");
    const [seats, setSeats] = useState(4);
    const [departureTime, setDepartureTime] = useState(new Date());
    const [showSuccess, setShowSuccess] = useState(false);

    const queryClient = useQueryClient();

    // טעינת פרטי משתמש בעלייה של הדף
    // useEffect(() => {
    //     const savedUser = localStorage.getItem('tremp_userData');
    //     if (savedUser) {
    //         try {
    //             const parsedUser = JSON.parse(savedUser);
    //             setUser(parsedUser);
    //             // מילוי ראשוני של שם הנהג
    //             setDriverName(`${parsedUser.firstName} ${parsedUser.lastName}`);
    //         } catch (e) {
    //             console.error("Error parsing user data", e);
    //         }
    //     }
    // }, []);

    const createRideMutation = useMutation({
        mutationFn: async (rideData) => {
            if (!user || !user.id) {
            throw new Error("User not identified");
            }
            // שולחים לשרת את התאריך המדויק שנבחר
            // (המשתמש בחר תאריך ושעה בטופס, והם נשמרים ב-departure_time)
            return await avior.entities.Ride.create({
                user_id: user.id,
                driver_name: rideData.driver_name,
                location: rideData.location,       // שים לב: אנחנו שולחים location
                destination: rideData.destination,
                seats: rideData.seats, // ברירת מחדל
                departure_time: rideData.departure_time.toISOString()
            });
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
            alert("נא למלא את כל השדות");
            return;
        }

        createRideMutation.mutate({
            driver_name: driverName,
            location: location,    
            destination: destination,
            seats: seats,
            departure_time: departureTime
        });
    };

    return (
        <div className="h-full flex items-start justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                    <div className="space-y-1 pb-2 pt-3 px-6">
                        <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                            טרמפיקציה
                        </CardTitle>
                        <CardDescription className="text-center text-slate-400">
                            שתף נסיעה עם הקהילה
                        </CardDescription>
                    </div>

                    <CardContent className="p-6">
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
                            onSubmit={handleSubmit}
                            isSubmitting={createRideMutation.isPending}
                        />
                    </CardContent>
                <SuccessNotification isVisible={showSuccess} />
            </motion.div>
        </div>
    );
}