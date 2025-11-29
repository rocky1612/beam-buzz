import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Loader2 } from "lucide-react";

export const NotificationSettings = () => {
  const { profile, isLoading, updateProfile } = useUserProfile();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [enableWhatsApp, setEnableWhatsApp] = useState(false);
  const [enableSMS, setEnableSMS] = useState(false);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phone_number || "");
      setEnableWhatsApp(profile.enable_whatsapp);
      setEnableSMS(profile.enable_sms);
      // Convert from "HH:MM:SS" to "HH:MM" for input
      setNotificationTime(profile.notification_time?.substring(0, 5) || "08:00");
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({
      phone_number: phoneNumber || null,
      enable_whatsapp: enableWhatsApp,
      enable_sms: enableSMS,
      notification_time: notificationTime + ":00", // Convert "HH:MM" to "HH:MM:SS"
    });
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure your WhatsApp and SMS notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="notification-time">Notification Time</Label>
          <Input
            id="notification-time"
            type="time"
            value={notificationTime}
            onChange={(e) => setNotificationTime(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Set when you want to receive daily lecture notifications
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter your phone number with country code (e.g., +1234567890)
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp">WhatsApp Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive lecture reminders on WhatsApp
              </p>
            </div>
            <Switch
              id="whatsapp"
              checked={enableWhatsApp}
              onCheckedChange={setEnableWhatsApp}
              disabled={!phoneNumber}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive lecture reminders via SMS
              </p>
            </div>
            <Switch
              id="sms"
              checked={enableSMS}
              onCheckedChange={setEnableSMS}
              disabled={!phoneNumber}
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};
