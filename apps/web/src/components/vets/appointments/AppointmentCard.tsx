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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { MutedText, BodyText, SectionTitle } from '@/components/ui/typography';

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  isUpcoming: boolean;
  isAnyDiscussionPointsExpanded?: boolean;
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
  const [isExpanded, setIsExpanded] = useState(false);

  const typeBadge = getAppointmentTypeBadge(appointment.appointmentType);
  const displayDate = formatDateForDisplay(appointment.appointmentDate);
  const displayTime = formatTimeForDisplay(appointment.appointmentTime);
  
  // Check if appointment time has passed
  const hasAppointmentTimePassed = (() => {
    const now = new Date();
    const apptDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    return now > apptDateTime;
  })();

  const fullAddress = [
    appointment.veterinarian.addressLine1,
    appointment.veterinarian.addressLine2,
    appointment.veterinarian.city,
    appointment.veterinarian.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="group hover:shadow-md transition-shadow duration-200 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SectionTitle>
                  {appointment.pet.name}
                </SectionTitle>
              </div>
              <Badge variant={typeBadge.variant} className="text-xs">
                {typeBadge.label}
              </Badge>
            </div>
            <CardAction>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <DropdownMenu modal={false} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
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
                        Edit Visit Summary
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
             </div>
            </CardAction>
          </div>
        </CardHeader>
   
        <CardContent className="space-y-0">
   
            {/* Always visible — date, time, vet */}
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
   
            <div className="pt-4 border-t mt-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{appointment.veterinarian.clinicName || appointment.veterinarian.vetName}</span>
              </div>
              {/* {appointment.veterinarian.clinicName && (
                <MutedText className="flex items-center gap-1 ml-6 text-xs">
                  <Stethoscope className="h-3 w-3" />
                  {appointment.veterinarian.vetName}
                </MutedText>
              )} */}
            </div>
   
            {/* Expanded details */}
            <CollapsibleContent className="space-y-3">
   
              {/* Address */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground pt-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs">{fullAddress}</span>
              </div>
   
              {/* Discussion points */}
              {appointment.reasonForVisit && (
                <div className="pt-2 border-t space-y-1">
                  <BodyText className="font-medium text-sm">Discussion points:</BodyText>
                  <MutedText className="text-xs whitespace-pre-wrap break-words">
                    {appointment.reasonForVisit}
                  </MutedText>
                </div>
              )}
   
              {/* Visit summary — past only */}
              {(!isUpcoming || hasAppointmentTimePassed) && (
                <div className="pt-2 border-t space-y-1">
                  <BodyText className="font-medium text-sm">Visit summary:</BodyText>
                  <MutedText className="text-xs whitespace-pre-wrap break-words">
                    {appointment.visitNotes}
                  </MutedText>
                </div>
              )}
            </CollapsibleContent>
        </CardContent>
       </Card>
      </Collapsible>
    );
  }