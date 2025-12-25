import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  FileText,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { AppointmentWithRelations, AppointmentType } from '@/types/appointments';
import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/validations/appointments';
import { useState } from 'react';

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  isUpcoming: boolean;
  onEdit: (appointment: AppointmentWithRelations) => void;
  onEditNotes: (appointment: AppointmentWithRelations) => void;
  onDelete: (appointment: AppointmentWithRelations) => void;
}

// Badge variant based on appointment type
const getAppointmentTypeBadge = (type: AppointmentType) => {
  const badges: Record<AppointmentType, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    checkup: { variant: 'default', label: 'Checkup' },
    vaccination: { variant: 'secondary', label: 'Vaccination' },
    surgery: { variant: 'destructive', label: 'Surgery' },
    dental: { variant: 'default', label: 'Dental' },
    grooming: { variant: 'secondary', label: 'Grooming' },
    emergency: { variant: 'destructive', label: 'Emergency' },
    other: { variant: 'outline', label: 'Other' },
  };
  return badges[type];
};

export default function AppointmentCard({
  appointment,
  isUpcoming,
  onEdit,
  onEditNotes,
  onDelete,
}: AppointmentCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const typeBadge = getAppointmentTypeBadge(appointment.appointmentType);
  const displayDate = formatDateForDisplay(appointment.appointmentDate);
  const displayTime = formatTimeForDisplay(appointment.appointmentTime);

  const fullAddress = [
    appointment.veterinarian.addressLine1,
    appointment.veterinarian.addressLine2,
    appointment.veterinarian.city,
    appointment.veterinarian.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">
                {appointment.pet.name}
              </CardTitle>
              <Badge variant={typeBadge.variant} className="text-xs">
                {typeBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {appointment.pet.animalType}
            </p>
          </div>
          <CardAction>
            <DropdownMenu modal={false} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isUpcoming ? (
                  <>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        onEdit(appointment);
                      }}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        onDelete(appointment);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        onEditNotes(appointment);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Edit Visit summary 
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        onDelete(appointment);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date and Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{displayDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{displayTime}</span>
          </div>
        </div>

        {/* Veterinarian Info */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{appointment.veterinarian.clinicName || appointment.veterinarian.vetName}</span>
          </div>
          {appointment.veterinarian.clinicName && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 ml-6">
              <Building2 className="h-3 w-3" />
              {appointment.veterinarian.vetName}
            </p>
          )}
          <div className="flex items-start gap-2 text-sm text-muted-foreground ml-6">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="text-xs">{fullAddress}</span>
          </div>
        </div>

        {/* Reason for Visit */}
        {appointment.reasonForVisit && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">Reminders/Notes:</p>
            <p className="text-sm whitespace-pre-wrap break-words">
              {appointment.reasonForVisit}
            </p>
          </div>
        )}

        {/* Visit Notes (for past appointments) */}
        {!isUpcoming && appointment.visitNotes && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">Visit summary:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {appointment.visitNotes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isUpcoming ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(appointment)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEditNotes(appointment)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Edit Visit Summary
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}