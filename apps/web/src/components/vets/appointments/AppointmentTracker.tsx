import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Loader2 } from 'lucide-react';
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

export default function AppointmentTracker() {
  const { data: upcomingAppointments, isPending: isPendingUpcoming } = useAppointments('upcoming');
  const { data: pastAppointments, isPending: isPendingPast } = useAppointments('past');
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
  const [expandedDiscussionPointsCount, setExpandedDiscussionPointsCount] = useState(0);
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

  if (isPendingUpcoming && isPendingPast) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!upcomingAppointments?.length && !pastAppointments?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No appointments yet</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first vet appointment
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Book New Appointment</DialogTitle>
                  <DialogDescription>
                    Schedule a vet appointment for your pet
                  </DialogDescription>
                </DialogHeader>
                <AppointmentForm
                  onSubmit={handleCreateAppointment}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isActionLoading}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Book New Appointment</DialogTitle>
                <DialogDescription>
                  Schedule a vet appointment for your pet
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm
                onSubmit={handleCreateAppointment}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={isActionLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" className="space-y-4" onValueChange={() => {
          setExpandedDiscussionPointsCount(0);
          setVisibleUpcomingCount(3);
          setVisiblePastCount(3);
          }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingAppointments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastAppointments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {isPendingUpcoming ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingAppointments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming appointments
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
                        Show More
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
                          Show Less
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVisibleUpcomingCount(3)}
                        >
                          Collapse All
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {isPendingPast ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pastAppointments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No past appointments
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastAppointments?.slice(0, visiblePastCount).map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      isUpcoming={false}
                      isAnyDiscussionPointsExpanded={expandedDiscussionPointsCount > 0}
                      onDiscussionPointsExpand={() => setExpandedDiscussionPointsCount(prev => prev + 1)}
                      onDiscussionPointsCollapse={() => setExpandedDiscussionPointsCount(prev => Math.max(0, prev - 1))}
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
                        Show More
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
                          Show Less
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVisiblePastCount(3)}
                        >
                          Collapse All
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
              <DialogDescription>
                Update appointment details
              </DialogDescription>
            </DialogHeader>
            {editingAppointment && (
              <AppointmentForm
                appointment={editingAppointment}
                onSubmit={handleUpdateAppointment}
                onCancel={() => setEditingAppointment(null)}
                isLoading={isActionLoading}
              />
            )}
          </DialogContent>
        </Dialog>

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
  );
}