import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Stethoscope,
  Building2,
  ChevronDown,
  ChevronRight,
  NotebookPen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Veterinarian } from '@/types/veterinarian';
import { usePets } from '@/queries/pets';
import { useVetPets } from '@/queries/vets';
import { MutedText, HelperText, EntryTitle } from '@/components/ui/typography';

interface VetCardProps {
  vet: Veterinarian;
  onEdit: (vet: Veterinarian) => void;
  onDelete: (vet: Veterinarian) => void;
}

export default function VetCard({
  vet,
  onEdit,
  onDelete,
}: VetCardProps) {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Fetch assigned pets
  const { data: allPets } = usePets();
  const { data: assignedPetData } = useVetPets(vet.id);

  // Calculate which pets are assigned
  const assignedPets = allPets?.filter((pet) => 
    assignedPetData?.some(assignment => assignment.petId === pet.id)
  ) ?? [];

  const fullAddress = [
    vet.addressLine1,
    vet.addressLine2,
    vet.city,
    vet.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-start gap-3 py-4 px-6">
        {/* Left — vet info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
              {vet.clinicName ? (
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <EntryTitle className="text-sm">
                  {vet.clinicName || vet.vetName}
                </EntryTitle>
              </div>

            {vet.clinicName && (
              <MutedText className="flex items-center gap-1 text-xs ml-6">
                <Stethoscope className="h-3 w-3 flex-shrink-0" />
                {vet.vetName}
              </MutedText>
            )}
            
            <a
              href={`tel:${vet.phone}`}
              className="flex items-center gap-1 ml-6 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3 flex-shrink-0" />
                {vet.phone}
            </a>

            {assignedPets.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-6 pt-1">
                {assignedPets.map((pet) => (
                  <Badge key={pet.id} variant="default" className="text-xs">
                    {pet.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          

          {/* Right — expand + dropdown */}
          <div className="flex items-center gap-1 flex-shrink-0">
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
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsDropdownOpen(false);
                    onEdit(vet);
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
                    onDelete(vet);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Expanded details — sibling to the flex row, inside Collapsible */}
        <CollapsibleContent>
              <div className="px-6 pb-4 space-y-2 border-t pt-3 ml-6">
                {vet.email && (
                  <a
                    href={`mailto:${vet.email}`}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    {vet.email}
                  </a>
                )}
                {vet.website && (
                  <a
                    href={vet.website.startsWith('http') ? vet.website : `https://${vet.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="h-3 w-3 flex-shrink-0" />
                    {vet.website}
                  </a>
                )}
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>{fullAddress}</span>
                </div>
                {vet.notes && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <NotebookPen className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <HelperText>{vet.notes}</HelperText>
                </div>                
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }