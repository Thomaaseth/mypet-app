import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar } from 'lucide-react';
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useUpdateVisitNotes,
  useDeleteAppointment,
} from '@/queries/appointments';
import AppointmentCard from './AppointmentCard';
import AppointmentForm from './AppointmentForm';
import EditNotesDialog from './EditNotesDialog';
import DeleteAppointmentDialog from './DeleteAppointmentDialog';
import type { AppointmentWithRelations, AppointmentFormData } from '@/types/appointments';
import { EmptyStateTitle, EmptyStateDescription, MutedText } from '@/components/ui/typography';
import { AppointmentTrackerSkeleton } from '@/components/ui/skeletons/AppointmentSkeleton';
import { EmptyStateCta } from '@/components/ui/empty-state-cta';
import { useTranslation } from 'react-i18next';

export default function AppointmentTracker() {
  const { t } = useTranslation();
  const { data: upcomingAppointments } = useAppointments('upcoming');
  const { data: pastAppointments } = useAppointments('past');
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const updateNotesMutation = useUpdateVisitNotes();
  const deleteMutation = useDeleteAppointment();

  const isActionLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateNotesMutation.isPending ||
    deleteMutation.isPending;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithRelations | null>(null);
  const [editingNotesAppointment, setEditingNotesAppointment] = useState<AppointmentWithRelations | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<AppointmentWithRelations | null>(null);
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(3);
  const [visiblePastCount, setVisiblePastCount] = useState(3);

  const handleCreateAppointment = async (
    appointmentData: AppointmentFormData
  ): Promise<AppointmentWithRelations | null> => {
    try {
      const result = await createMutation.mutateAsync(appointmentData);
      setIsCreateDialogOpen(false);
      return result;
    } catch (error) {
      return null;
    }
  };

  const handleUpdateAppointment = async (
    appointmentData: AppointmentFormData
  ): Promise<AppointmentWithRelations | null> => {
    if (!editingAppointment) return null;

    try {
      const result = await updateMutation.mutateAsync({
        appointmentId: editingAppointment.id,
        appointmentData,
      });
      setEditingAppointment(null);
      return result;
    } catch (error) {
      return null;
    }
  };

  const handleUpdateNotes = async (appointmentId: string, visitNotes: string) => {
    try {
      await updateNotesMutation.mutateAsync({ appointmentId, visitNotes });
      setEditingNotesAppointment(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deletingAppointment) return;

    try {
      await deleteMutation.mutateAsync(deletingAppointment.id);
      setDeletingAppointment(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (upcomingAppointments === undefined && pastAppointments === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('appointments.tracker.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentTrackerSkeleton />
        </CardContent>
      </Card>
    );
  }
   

  if (!upcomingAppointments?.length && !pastAppointments?.length) {
    return (
      <>
        <ResponsiveDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          title={t('appointments.tracker.bookDialogTitle')}
          description={t('appointments.tracker.bookDialogDescription')}
        >
          <AppointmentForm
            onSubmit={handleCreateAppointment}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isActionLoading}
          />
        </ResponsiveDialog>
  
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('appointments.tracker.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyStateCta
              icon={Calendar}
              title={t('appointments.tracker.emptyTitle')}
              description={t('appointments.tracker.emptyDescription')}
              buttonLabel={t('appointments.tracker.bookAppointment')}
              onAction={() => setIsCreateDialogOpen(true)}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
      <>
        <ResponsiveDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          title={t('appointments.tracker.bookDialogTitle')}
          description={t('appointments.tracker.bookDialogDescription')}
        >
          <AppointmentForm
            onSubmit={handleCreateAppointment}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isActionLoading}
          />
        </ResponsiveDialog>
    
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('appointments.tracker.title')}
              </CardTitle>
              {upcomingAppointments && upcomingAppointments.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('appointments.tracker.bookAppointment')}</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="space-y-4" onValueChange={() => {
              setVisibleUpcomingCount(3);
              setVisiblePastCount(3);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">
                  {t('appointments.tracker.upcomingTab', { count: upcomingAppointments?.length || 0 })}
                </TabsTrigger>
                <TabsTrigger value="past">
                  {t('appointments.tracker.pastTab', { count: pastAppointments?.length || 0 })}
                </TabsTrigger>
              </TabsList>
    
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingAppointments === undefined ? (
                  <AppointmentTrackerSkeleton />
                ) : upcomingAppointments?.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <EmptyStateTitle className="mb-2">{t('appointments.tracker.noUpcomingTitle')}</EmptyStateTitle>
                    <EmptyStateDescription className="mb-4">
                      {t('appointments.tracker.noUpcomingDescription')}
                    </EmptyStateDescription>
                    <Button size= "sm" onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      {t('appointments.tracker.bookAppointment')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {upcomingAppointments?.slice(0, visibleUpcomingCount).map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          isUpcoming={true}
                          onEdit={setEditingAppointment}
                          onEditNotes={setEditingNotesAppointment}
                          onDelete={setDeletingAppointment}
                        />
                      ))}
                    </div>
                    {upcomingAppointments && upcomingAppointments.length > 3 && (
                      <div className="flex justify-center gap-2 pt-4">
                        {visibleUpcomingCount < upcomingAppointments.length && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVisibleUpcomingCount(prev => Math.min(prev + 3, upcomingAppointments.length))}
                          >
                            {t('appointments.tracker.showMore')}
                          </Button>
                        )}
                        {visibleUpcomingCount > 3 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVisibleUpcomingCount(prev => {
                                const remainder = (prev - 3) % 3;
                                return Math.max(3, prev - (remainder === 0 ? 3 : remainder));
                              })}
                            >
                              {t('appointments.tracker.showLess')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVisibleUpcomingCount(3)}
                            >
                              {t('appointments.tracker.collapseAll')}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
    
              <TabsContent value="past" className="space-y-4">
                {pastAppointments === undefined ? (
                  <AppointmentTrackerSkeleton />
                ) : pastAppointments?.length === 0 ? (
                  <div className="text-center py-8">
                    <MutedText>{t('appointments.tracker.noPastAppointments')}</MutedText>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pastAppointments?.slice(0, visiblePastCount).map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          isUpcoming={false}
                          onEdit={setEditingAppointment}
                          onEditNotes={setEditingNotesAppointment}
                          onDelete={setDeletingAppointment}
                        />
                      ))}
                    </div>
                    {pastAppointments && pastAppointments.length > 3 && (
                      <div className="flex justify-center gap-2 pt-4">
                        {visiblePastCount < pastAppointments.length && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVisiblePastCount(prev => Math.min(prev + 3, pastAppointments.length))}
                          >
                            {t('appointments.tracker.showMore')}
                          </Button>
                        )}
                        {visiblePastCount > 3 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVisiblePastCount(prev => {
                                const remainder = (prev - 3) % 3;
                                return Math.max(3, prev - (remainder === 0 ? 3 : remainder));
                              })}
                            >
                              {t('appointments.tracker.showLess')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVisiblePastCount(3)}
                            >
                              {t('appointments.tracker.collapseAll')}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
    
            {/* Edit Appointment Dialog */}
            <ResponsiveDialog
              open={!!editingAppointment}
              onOpenChange={(open) => { if (!open) setEditingAppointment(null); }}
              title={t('appointments.tracker.editDialogTitle')}
              description={t('appointments.tracker.editDialogDescription')}
            >
              {editingAppointment && (
                <AppointmentForm
                  appointment={editingAppointment}
                  onSubmit={handleUpdateAppointment}
                  onCancel={() => setEditingAppointment(null)}
                  isLoading={isActionLoading}
                />
              )}
            </ResponsiveDialog>
    
            {/* Edit Notes Dialog */}
            <EditNotesDialog
              appointment={editingNotesAppointment}
              isLoading={updateNotesMutation.isPending}
              onSubmit={handleUpdateNotes}
              onCancel={() => setEditingNotesAppointment(null)}
            />
    
            {/* Delete Dialog */}
            <DeleteAppointmentDialog
              appointment={deletingAppointment}
              isUpcoming={deletingAppointment ? new Date(deletingAppointment.appointmentDate) >= new Date() : false}
              isDeleting={deleteMutation.isPending}
              onConfirm={handleDeleteAppointment}
              onCancel={() => setDeletingAppointment(null)}
            />
          </CardContent>
        </Card>
      </>
    );
}