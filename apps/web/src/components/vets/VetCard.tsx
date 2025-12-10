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
  Star,
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

interface VetCardProps {
  vet: Veterinarian;
  onEdit: (vet: Veterinarian) => void;
  onDelete: (vet: Veterinarian) => void;
  assignedPetCount?: number;
  isPrimaryForAnyPet?: boolean;
}

export default function VetCard({
  vet,
  onEdit,
  onDelete,
  assignedPetCount = 0,
  isPrimaryForAnyPet = false,
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

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {vet.clinicName || vet.vetName}
              </CardTitle>
              {isPrimaryForAnyPet && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" aria-label="Primary vet" />
              )}
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
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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

      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
            <a href={`tel:${vet.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{vet.phone}</span>
            </a>
            {vet.email && (
            <a href={`mailto:${vet.email}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{vet.email}</span>
            </a>
            )}

            {vet.website && (
            <a href={vet.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{vet.website}</span>
            </a>
            )}

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{fullAddress}</span>
          </div>
        </div>

        {vet.notes && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            <p className="line-clamp-2">
              {vet.notes.length > 100
                ? `${vet.notes.substring(0, 100)}...`
                : vet.notes}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
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