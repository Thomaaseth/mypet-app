import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Calendar,
  Weight,
  Heart,
  HeartOff,
  Venus,
  Mars,
  CircleHelp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Pet } from '@/types/pet';
import { calculatePetAge } from '@/lib/validations/pet';
import { useState } from 'react';
import { useWeightEntries } from '@/queries/weights';
import { usePetSignedUrl } from '@/queries/pets';
import { MutedText } from '@/components/ui/typography';

interface PetCardProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  onView?: (pet: Pet) => void;
}

export default function PetCard({ pet, onEdit, onDelete, onView }: PetCardProps) {
  const [imageError, setImageError] = useState(false);
  const { data: signedUrl } = usePetSignedUrl(pet.id, Boolean(pet.imageUrl));

  const age = calculatePetAge(pet.birthDate);

  // Query latest weight from weight_entries
  const { data: weightData } = useWeightEntries({ 
    petId: pet.id, 
  });  

  const latestWeight = weightData?.latestWeight;

  // Placeholder image when no image is available or error loading
  const placeholderImage = (
    <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center">
      <div className="text-center">
        <img
            src="/single/Pettr-Paw_2026.svg"
            aria-hidden="true"
            className="w-40 h-40 opacity-[1] pointer-events-none select-none"
            alt=""
          />        
          <MutedText>No photo</MutedText>
        </div>
    </div>
  );



  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 relative overflow-hidden h-full">
      <CardHeader className="pb-0">
  
      {/* Decorative paw background */}
      <img
            src="/single/Pettr-Paw_2026.svg"
            aria-hidden="true"
            className="absolute -bottom-4 -right-4 w-2/5 opacity-[0.15] pointer-events-none select-none"
            alt=""
          />   

        {/* Name + menu — always on top */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-base truncate">{pet.name}</p>
            <MutedText className="capitalize">
              {pet.species || pet.animalType}
            </MutedText>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(pet)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(pet)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </CardHeader>
        <CardContent className="pt-1 px-4 pb-4">

        {/* Photo left, info right on mobile/tablet — stacked on desktop */}
        <div className="flex gap-3 lg:flex-col lg:gap-0">

          {/* Photo */}
          <div className="flex-shrink-0 w-[45%] aspect-square lg:w-full lg:aspect-square lg:mb-3">
            {signedUrl && !imageError ? (
              <img
                src={signedUrl}
                alt={`Photo of ${pet.name}`}
                className="w-full h-full lg:h-auto object-cover rounded-md"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full lg:aspect-square bg-muted rounded-md flex items-center justify-center">
                <Heart className="h-6 w-6 lg:h-8 lg:w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">

            {/* Gender / Neutered / Age / Weight */}
            <div className="flex flex-col gap-y-4 text-sm">

              <div className="flex items-center gap-2">
                {pet.gender === 'male' && <Mars className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                {pet.gender === 'female' && <Venus className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                {pet.gender === 'unknown' && <CircleHelp className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <span className="capitalize truncate">{pet.gender}</span>
              </div>
              {pet.isNeutered && (
                <div className="flex items-center gap-2">
                  <HeartOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">Spayed/Neutered</span>
                </div>
              )}
              {pet.birthDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{age}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">
                  {latestWeight ? `${latestWeight.weight} ${latestWeight.weightUnit}` : 'No weight'}
                </span>
              </div>
            </div>

            {/* Notes handled in widget */}
            {/* {pet.notes && (
              <div className="flex items-start gap-2">
                <NotebookPen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <MutedText className="line-clamp-2 text-xs">
                  {pet.notes}
                </MutedText>
              </div>
            )} */}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

          {/* Microchip */}
          {/* {pet.microchipNumber && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Chip: {pet.microchipNumber}</span>
            </div>
          )} */}