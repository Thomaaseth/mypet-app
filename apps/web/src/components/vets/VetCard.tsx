import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
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
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Veterinarian } from '@/types/veterinarian';
import { usePets } from '@/queries/pets';
import { useVetPets } from '@/queries/vets';

interface VetCardProps {
  vet: Veterinarian;
  onEdit: (vet: Veterinarian) => void;
  onDelete: (vet: Veterinarian) => void;
  assignedPetCount?: number;
}

export default function VetCard({
  vet,
  onEdit,
  onDelete,
  assignedPetCount = 0,
}: VetCardProps) {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fullAddress = [
    vet.addressLine1,
    vet.addressLine2,
    vet.city,
    vet.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  // Fetch assigned pets
  const { data: allPets } = usePets();
  const { data: assignedPetData } = useVetPets(vet.id);

  // Calculate which pets are assigned
  const assignedPets = allPets?.filter(pet => 
    assignedPetData?.some(assignment => assignment.petId === pet.id)
  ) || [];

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {vet.clinicName || vet.vetName}
              </CardTitle>
            </div>
            {vet.clinicName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {vet.vetName}
              </p>
            )}
            {assignedPetCount > 0 && (
              <Badge variant="secondary" className="text-xs mt-1">
                {assignedPetCount} {assignedPetCount === 1 ? 'pet' : 'pets'}
              </Badge>
            )}
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
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col">
        {/* Contact Information - Fixed height */}
        <div className="space-y-2 text-sm h-[120px]">
          <a 
            href={`tel:${vet.phone}`} 
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{vet.phone}</span>
          </a>
          
          {vet.email && (
            <a 
              href={`mailto:${vet.email}`} 
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{vet.email}</span>
            </a>
          )}

          {vet.website && (
            <a         
              href={vet.website.startsWith('http') ? vet.website : `https://${vet.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{vet.website}</span>
            </a>
          )}

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{fullAddress}</span>
          </div>
        </div>

        {/* Notes - Fixed height */}
        <div className="text-sm text-muted-foreground pt-3 border-t h-[80px]">
          {vet.notes && (
            <p className="whitespace-pre-wrap break-words">
              {vet.notes}
            </p>
          )}
        </div>

        {/* Assigned Pets - Fixed height */}
        <div className="pt-3 border-t h-[120px]">
          {assignedPets.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-2">Assigned Pets:</p>
              <div className="flex flex-wrap gap-1">
                {assignedPets.map((pet) => (
                  <Badge key={pet.id} variant="default" className="text-xs">
                    {pet.name}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(vet)}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}