import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { EmptyStateCta } from '@/components/ui/empty-state-cta';
import { Plus, Bug, AlertCircle, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { AntiParasiteForm } from './AntiParasiteForm';
import { CategoryCard } from './CategoryCard';
import AntiParasiteHistoryList from './AntiParasiteHistoryList';
import { AntiParasiteTrackerSkeleton } from '@/components/ui/skeletons/AntiParasiteSkeleton';
import { antiParasiteTreatmentErrorHandler } from '@/lib/api/domains/anti-parasite-treatments';
import { ANTI_PARASITE_CATEGORIES } from '@/lib/validations/anti-parasite-treatment';
import type { AntiParasiteCategory } from '@/lib/validations/anti-parasite-treatment';
import type {
  AntiParasiteTreatment,
  AntiParasiteTreatmentFormData,
} from '@/types/anti-parasite-treatments';
import {
  useAntiParasiteTreatments,
  useCreateAntiParasiteTreatment,
  useUpdateAntiParasiteTreatment,
  useDeleteAntiParasiteTreatment,
} from '@/queries/anti-parasite-treatments';
import { MutedText } from '@/components/ui/typography';
import { useTranslation } from 'react-i18next';

interface AntiParasiteTrackerProps {
  petId: string;
}

export function AntiParasiteTracker({ petId }: AntiParasiteTrackerProps) {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { data: treatments, error } = useAntiParasiteTreatments({ petId });

  const createMutation = useCreateAntiParasiteTreatment(petId);
  const updateMutation = useUpdateAntiParasiteTreatment(petId);
  const deleteMutation = useDeleteAntiParasiteTreatment(petId);

  const isActionLoading =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // The current active treatment for a category = the newest entry that
  // covers it AND is still active (server-computed isActive). The list is
  // newest-first, so the first match wins. null → "Not tracked".
  const deriveActiveTreatment = (
    category: AntiParasiteCategory,
  ): AntiParasiteTreatment | null => {
    if (!treatments) return null;
    return (
      treatments.find((tr) => tr.isActive && tr.categories.includes(category)) ?? null
    );
  };

  // Shared mutation handlers — passed to sub-cards (edit/delete their active
  // treatment) and the history list (delete). One create/update/delete path.
  const handleCreate = async (
    data: AntiParasiteTreatmentFormData,
  ): Promise<AntiParasiteTreatment | null> => {
    try {
      const result = await createMutation.mutateAsync(data);
      setIsAddDialogOpen(false);
      return result;
    } catch {
      return null;
    }
  };

  const handleUpdate = async (
    treatmentId: string,
    data: AntiParasiteTreatmentFormData,
  ): Promise<AntiParasiteTreatment | null> => {
    try {
      return await updateMutation.mutateAsync({ treatmentId, data });
    } catch {
      return null;
    }
  };

  const handleDelete = async (treatmentId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(treatmentId);
      return true;
    } catch {
      return false;
    }
  };

  // Loading (initial fetch)
  if (treatments === undefined && !error) {
    return <AntiParasiteTrackerSkeleton />;
  }

  // Error
  if (error) {
    const appError = antiParasiteTreatmentErrorHandler(error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            {t('antiParasite.tracker.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{appError.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const allTreatments = treatments ?? [];
  const hasAnyTreatments = allTreatments.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            <CardTitle>{t('antiParasite.tracker.title')}</CardTitle>
          </div>

          {/* Header CTA only when there's at least one treatment; the zero
              state shows its own EmptyStateCta below. Shrinks to "+" on sm. */}
          {hasAnyTreatments && (
            <Button
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('antiParasite.tracker.addTreatment')}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasAnyTreatments ? (
          <EmptyStateCta
            icon={Bug}
            title={t('antiParasite.tracker.emptyTitle')}
            description={t('antiParasite.tracker.emptyDescription')}
            buttonLabel={t('antiParasite.tracker.emptyButtonLabel')}
            onAction={() => setIsAddDialogOpen(true)}
            withCard={false}
          />
        ) : (
          <>
            {/* 3 sub-cards — one per category, each showing its active
                treatment or "Not tracked" */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ANTI_PARASITE_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category}
                  category={category}
                  activeTreatment={deriveActiveTreatment(category)}
                  onUpdateTreatment={handleUpdate}
                  onDeleteTreatment={handleDelete}
                  isLoading={isActionLoading}
                />
              ))}
            </div>

            {/* Unified history — all entries, newest first */}
            <Card>
              <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/75 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <MutedText className="font-display flex items-center gap-2">
                          {t('antiParasite.tracker.history')}
                        </MutedText>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {t('antiParasite.tracker.entries', { count: allTreatments.length })}
                        </span>
                        {isHistoryOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <AntiParasiteHistoryList
                      treatments={allTreatments}
                      onDeleteTreatment={handleDelete}
                      isLoading={isActionLoading}
                      isHistoryOpen={isHistoryOpen}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </>
        )}
      </CardContent>

      {/* Add dialog — shared by header CTA and empty-state CTA */}
      <ResponsiveDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title={t('antiParasite.tracker.addDialogTitle')}
        description={t('antiParasite.tracker.addDialogDescription')}
      >
        <AntiParasiteForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddDialogOpen(false)}
          isLoading={createMutation.isPending}
        />
      </ResponsiveDialog>
    </Card>
  );
}