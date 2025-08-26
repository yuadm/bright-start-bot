import { References, EmploymentHistory } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReferencesStepProps {
  data: References;
  employmentHistory: EmploymentHistory;
  updateData: (field: keyof References, value: any) => void;
}

export function ReferencesStep({ data, employmentHistory, updateData }: ReferencesStepProps) {
  const updateReference = (refNumber: 'reference1' | 'reference2', field: string, value: string) => {
    updateData(refNumber, { ...data[refNumber], [field]: value });
  };

  const updateReferenceType = (refNumber: 'reference1' | 'reference2', type: 'employer' | 'character') => {
    const currentRef = data[refNumber] || {};
    // Clear type-specific fields when changing type
    const clearedRef = {
      ...currentRef,
      referenceType: type,
      employmentFrom: undefined,
      employmentTo: undefined,
      employmentPosition: undefined,
      relationshipType: undefined,
      knownDuration: undefined,
    };
    updateData(refNumber, clearedRef);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">References</h3>
        <p className="text-muted-foreground mb-6">
          Please provide two references. You can choose employer references or character references for each one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reference 1 ** All fields are required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Reference Type *</Label>
            <Select 
              value={data.reference1?.referenceType || 'employer'} 
              onValueChange={(value: 'employer' | 'character') => updateReferenceType('reference1', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reference type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employer">Employer Reference</SelectItem>
                <SelectItem value="character">Character Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={data.reference1?.name || ''}
                onChange={(e) => updateReference('reference1', 'name', e.target.value)}
                placeholder="Name"
                required
              />
            </div>
            <div>
              <Label>Company *</Label>
              <Input
                value={data.reference1?.company || ''}
                onChange={(e) => updateReference('reference1', 'company', e.target.value)}
                placeholder="Company"
                required
              />
            </div>
            <div>
              <Label>Job Title *</Label>
              <Input
                value={data.reference1?.jobTitle || ''}
                onChange={(e) => updateReference('reference1', 'jobTitle', e.target.value)}
                placeholder="Job Title"
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={data.reference1?.email || ''}
                onChange={(e) => updateReference('reference1', 'email', e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={data.reference1?.address || ''}
                onChange={(e) => updateReference('reference1', 'address', e.target.value)}
                placeholder="Address"
                required
              />
            </div>
            <div>
              <Label>Address2</Label>
              <Input
                value={data.reference1?.address2 || ''}
                onChange={(e) => updateReference('reference1', 'address2', e.target.value)}
                placeholder="Address2"
              />
            </div>
            <div>
              <Label>Town *</Label>
              <Input
                value={data.reference1?.town || ''}
                onChange={(e) => updateReference('reference1', 'town', e.target.value)}
                placeholder="Town"
                required
              />
            </div>
            <div>
              <Label>Contact Number *</Label>
              <Input
                type="tel"
                value={data.reference1?.contactNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  updateReference('reference1', 'contactNumber', value);
                }}
                placeholder="Contact Number"
                required
              />
            </div>
            <div>
              <Label>Postcode *</Label>
              <Input
                value={data.reference1?.postcode || ''}
                onChange={(e) => updateReference('reference1', 'postcode', e.target.value)}
                placeholder="Postcode"
                required
              />
            </div>
          </div>
          
          {/* Type-specific fields */}
          {data.reference1?.referenceType === 'employer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Employment From *</Label>
                <Input
                  type="date"
                  value={data.reference1?.employmentFrom || ''}
                  onChange={(e) => updateReference('reference1', 'employmentFrom', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Employment To *</Label>
                <Input
                  type="date"
                  value={data.reference1?.employmentTo || ''}
                  onChange={(e) => updateReference('reference1', 'employmentTo', e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Position Held *</Label>
                <Input
                  value={data.reference1?.employmentPosition || ''}
                  onChange={(e) => updateReference('reference1', 'employmentPosition', e.target.value)}
                  placeholder="Position held during employment"
                  required
                />
              </div>
            </div>
          )}
          
          {data.reference1?.referenceType === 'character' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Relationship Type *</Label>
                <Select 
                  value={data.reference1?.relationshipType || ''} 
                  onValueChange={(value) => updateReference('reference1', 'relationshipType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="family_friend">Family Friend</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="community_leader">Community Leader</SelectItem>
                    <SelectItem value="teacher">Teacher/Instructor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>How long have you known this person? *</Label>
                <Input
                  value={data.reference1?.knownDuration || ''}
                  onChange={(e) => updateReference('reference1', 'knownDuration', e.target.value)}
                  placeholder="e.g., 5 years, 2 months"
                  required
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reference 2 ** All fields are required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Reference Type *</Label>
            <Select 
              value={data.reference2?.referenceType || 'employer'} 
              onValueChange={(value: 'employer' | 'character') => updateReferenceType('reference2', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reference type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employer">Employer Reference</SelectItem>
                <SelectItem value="character">Character Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={data.reference2?.name || ''}
                onChange={(e) => updateReference('reference2', 'name', e.target.value)}
                placeholder="Name"
                required
              />
            </div>
            <div>
              <Label>Company *</Label>
              <Input
                value={data.reference2?.company || ''}
                onChange={(e) => updateReference('reference2', 'company', e.target.value)}
                placeholder="Company"
                required
              />
            </div>
            <div>
              <Label>Job Title *</Label>
              <Input
                value={data.reference2?.jobTitle || ''}
                onChange={(e) => updateReference('reference2', 'jobTitle', e.target.value)}
                placeholder="Job Title"
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={data.reference2?.email || ''}
                onChange={(e) => updateReference('reference2', 'email', e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={data.reference2?.address || ''}
                onChange={(e) => updateReference('reference2', 'address', e.target.value)}
                placeholder="Address"
                required
              />
            </div>
            <div>
              <Label>Address2</Label>
              <Input
                value={data.reference2?.address2 || ''}
                onChange={(e) => updateReference('reference2', 'address2', e.target.value)}
                placeholder="Address2"
              />
            </div>
            <div>
              <Label>Town *</Label>
              <Input
                value={data.reference2?.town || ''}
                onChange={(e) => updateReference('reference2', 'town', e.target.value)}
                placeholder="Town"
                required
              />
            </div>
            <div>
              <Label>Contact Number *</Label>
              <Input
                type="tel"
                value={data.reference2?.contactNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  updateReference('reference2', 'contactNumber', value);
                }}
                placeholder="Contact Number"
                required
              />
            </div>
            <div>
              <Label>Postcode *</Label>
              <Input
                value={data.reference2?.postcode || ''}
                onChange={(e) => updateReference('reference2', 'postcode', e.target.value)}
                placeholder="Postcode"
                required
              />
            </div>
          </div>
          
          {/* Type-specific fields */}
          {data.reference2?.referenceType === 'employer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Employment From *</Label>
                <Input
                  type="date"
                  value={data.reference2?.employmentFrom || ''}
                  onChange={(e) => updateReference('reference2', 'employmentFrom', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Employment To *</Label>
                <Input
                  type="date"
                  value={data.reference2?.employmentTo || ''}
                  onChange={(e) => updateReference('reference2', 'employmentTo', e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Position Held *</Label>
                <Input
                  value={data.reference2?.employmentPosition || ''}
                  onChange={(e) => updateReference('reference2', 'employmentPosition', e.target.value)}
                  placeholder="Position held during employment"
                  required
                />
              </div>
            </div>
          )}
          
          {data.reference2?.referenceType === 'character' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Relationship Type *</Label>
                <Select 
                  value={data.reference2?.relationshipType || ''} 
                  onValueChange={(value) => updateReference('reference2', 'relationshipType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="family_friend">Family Friend</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="community_leader">Community Leader</SelectItem>
                    <SelectItem value="teacher">Teacher/Instructor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>How long have you known this person? *</Label>
                <Input
                  value={data.reference2?.knownDuration || ''}
                  onChange={(e) => updateReference('reference2', 'knownDuration', e.target.value)}
                  placeholder="e.g., 5 years, 2 months"
                  required
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}