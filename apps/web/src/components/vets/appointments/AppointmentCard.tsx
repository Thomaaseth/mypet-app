import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
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
import { useState } from 'react';
import { MutedText, BodyText, SectionTitle } from '@/components/ui/typography';
import { LONG_DATE_DISPLAY_OPTIONS } from '@/lib/utils/date-formatting';
import { useTranslation } from 'react-i18next';
import { APPOINTMENT_TYPE_KEYS } from '@/i18n/enum-keys';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  isUpcoming: boolean;
  isAnyDiscussionPointsExpanded?: boolean;
  onEdit: (appointment: AppointmentWithRelations) => void;
  onEditNotes: (appointment: AppointmentWithRelations) => void;
  onDelete: (appointment: AppointmentWithRelations) => void;
}

// Badge variant based on appointment type
const APPOINTMENT_TYPE_BADGE_VARIANT: Record<AppointmentType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  checkup: 'default',
  vaccination: 'secondary',
  surgery: 'destructive',
  dental: 'default',
  grooming: 'secondary',
  emergency: 'destructive',
  other: 'outline',
};

export default function AppointmentCard({
  appointment,
  isUpcoming,
  onEdit,
  onEditNotes,
  onDelete,
}: AppointmentCardProps) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { formatDate, formatTime } = useDateTimeFormatters();

  const badgeVariant = APPOINTMENT_TYPE_BADGE_VARIANT[appointment.appointmentType];
  const displayDate = formatDate(appointment.appointmentDate, LONG_DATE_DISPLAY_OPTIONS)
  const displayTime = formatTime(appointment.appointmentTime);

  
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
              <Badge variant={badgeVariant} className="text-xs">
                {t(APPOINTMENT_TYPE_KEYS[appointment.appointmentType])}
              </Badge>
            </div>
            <CardAction>
            <div className="flex items-center gap-2">
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
                    <span className="sr-only">{t('vets.card.openMenu')}</span>
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
                        {t('common.actions.edit')}
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
                        {t('common.actions.cancel')}
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
                        {t('appointments.card.editVisitSummary')}
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
                        {t('common.actions.delete')}
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
                  <BodyText className="font-medium text-sm">{t('appointments.card.discussionPointsLabel')}</BodyText>
                  <MutedText className="text-xs whitespace-pre-wrap break-words">
                    {appointment.reasonForVisit}
                  </MutedText>
                </div>
              )}
   
              {/* Visit summary — past only */}
              {(!isUpcoming || hasAppointmentTimePassed) && (
                <div className="pt-2 border-t space-y-1">
                  <BodyText className="font-medium text-sm">{t('appointments.card.visitSummaryLabel')}</BodyText>
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