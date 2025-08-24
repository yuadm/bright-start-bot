import { EmploymentHistory } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface EmploymentHistoryStepProps {
  data: EmploymentHistory;
  updateData: (field: keyof EmploymentHistory, value: any) => void;
}

const emptyEmployer = {
  company: '',
  name: '',
  email: '',
  position: '',
  address: '',
  address2: '',
  town: '',
  postcode: '',
  telephone: '',
  from: '',
  to: '',
  leavingDate: '',
  keyTasks: '',
  reasonForLeaving: '',
};

export function EmploymentHistoryStep({ data, updateData }: EmploymentHistoryStepProps) {
  const addPreviousEmployer = () => {
    const currentEmployers = data.previousEmployers || [];
    updateData('previousEmployers', [...currentEmployers, { ...emptyEmployer }]);
  };

  const removePreviousEmployer = (index: number) => {
    const currentEmployers = data.previousEmployers || [];
    updateData('previousEmployers', currentEmployers.filter((_, i) => i !== index));
  };

  const updateRecentEmployer = (field: string, value: string) => {
    updateData('recentEmployer', { ...data.recentEmployer, [field]: value });
  };

  const updatePreviousEmployer = (index: number, field: string, value: string) => {
    const currentEmployers = data.previousEmployers || [];
    const updated = currentEmployers.map((emp, i) => 
      i === index ? { ...emp, [field]: value } : emp
    );
    updateData('previousEmployers', updated);
  };

  if (data.previouslyEmployed === '') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Employment History</h3>
          <p className="text-muted-foreground mb-6">Please tell us about your employment history.</p>
        </div>

        <div>
          <Label htmlFor="previouslyEmployed">Were you previously employed? *</Label>
          <Select value={data.previouslyEmployed} onValueChange={(value) => updateData('previouslyEmployed', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (data.previouslyEmployed === 'yes') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Employment History</h3>
          <p className="text-muted-foreground mb-6">Please provide details of your employment history, starting with your most recent employer.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Most Recent Employer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company *</Label>
                <Input
                  value={data.recentEmployer?.company || ''}
                  onChange={(e) => updateRecentEmployer('company', e.target.value)}
                  placeholder="Employer Name"
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={data.recentEmployer?.name || ''}
                  onChange={(e) => updateRecentEmployer('name', e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={data.recentEmployer?.email || ''}
                  onChange={(e) => updateRecentEmployer('email', e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label>Position Held *</Label>
                <Input
                  value={data.recentEmployer?.position || ''}
                  onChange={(e) => updateRecentEmployer('position', e.target.value)}
                  placeholder="Position"
                />
              </div>
              <div>
                <Label>Address *</Label>
                <Input
                  value={data.recentEmployer?.address || ''}
                  onChange={(e) => updateRecentEmployer('address', e.target.value)}
                  placeholder="Address"
                />
              </div>
              <div>
                <Label>Address 2</Label>
                <Input
                  value={data.recentEmployer?.address2 || ''}
                  onChange={(e) => updateRecentEmployer('address2', e.target.value)}
                  placeholder="Address 2"
                />
              </div>
              <div>
                <Label>Town *</Label>
                <Input
                  value={data.recentEmployer?.town || ''}
                  onChange={(e) => updateRecentEmployer('town', e.target.value)}
                  placeholder="Town"
                />
              </div>
              <div>
                <Label>Postcode *</Label>
                <Input
                  value={data.recentEmployer?.postcode || ''}
                  onChange={(e) => updateRecentEmployer('postcode', e.target.value)}
                  placeholder="Postcode"
                />
              </div>
              <div>
                <Label>Telephone Number *</Label>
                <Input
                  value={data.recentEmployer?.telephone || ''}
                  onChange={(e) => updateRecentEmployer('telephone', e.target.value)}
                  placeholder="Contact Number"
                />
              </div>
              <div>
                <Label>From *</Label>
                <Input
                  type="date"
                  value={data.recentEmployer?.from || ''}
                  onChange={(e) => updateRecentEmployer('from', e.target.value)}
                />
              </div>
              <div>
                <Label>To *</Label>
                <Input
                  type="date"
                  value={data.recentEmployer?.to || ''}
                  onChange={(e) => updateRecentEmployer('to', e.target.value)}
                />
              </div>
              <div>
                <Label>Leaving date or notice (if relevant)</Label>
                <Input
                  type="date"
                  value={data.recentEmployer?.leavingDate || ''}
                  onChange={(e) => updateRecentEmployer('leavingDate', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Key Tasks/Responsibilities</Label>
              <Textarea
                value={data.recentEmployer?.keyTasks || ''}
                onChange={(e) => updateRecentEmployer('keyTasks', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Reason for leaving *</Label>
              <Textarea
                value={data.recentEmployer?.reasonForLeaving || ''}
                onChange={(e) => updateRecentEmployer('reasonForLeaving', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold">Previous Employers (from most recent)</h4>
            <Button type="button" onClick={addPreviousEmployer} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Previous Employer
            </Button>
          </div>

          {data.previousEmployers?.map((employer, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Previous Employer {index + 1}</CardTitle>
                  <Button 
                    type="button" 
                    onClick={() => removePreviousEmployer(index)} 
                    size="sm" 
                    variant="outline"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company *</Label>
                    <Input
                      value={employer.company}
                      onChange={(e) => updatePreviousEmployer(index, 'company', e.target.value)}
                      placeholder="Employer Name"
                    />
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={employer.name}
                      onChange={(e) => updatePreviousEmployer(index, 'name', e.target.value)}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={employer.email}
                      onChange={(e) => updatePreviousEmployer(index, 'email', e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <Label>Position Held *</Label>
                    <Input
                      value={employer.position}
                      onChange={(e) => updatePreviousEmployer(index, 'position', e.target.value)}
                      placeholder="Position"
                    />
                  </div>
                  <div>
                    <Label>Address *</Label>
                    <Input
                      value={employer.address}
                      onChange={(e) => updatePreviousEmployer(index, 'address', e.target.value)}
                      placeholder="Address"
                    />
                  </div>
                  <div>
                    <Label>Address 2</Label>
                    <Input
                      value={employer.address2}
                      onChange={(e) => updatePreviousEmployer(index, 'address2', e.target.value)}
                      placeholder="Address 2"
                    />
                  </div>
                  <div>
                    <Label>Town *</Label>
                    <Input
                      value={employer.town}
                      onChange={(e) => updatePreviousEmployer(index, 'town', e.target.value)}
                      placeholder="Town"
                    />
                  </div>
                  <div>
                    <Label>Postcode *</Label>
                    <Input
                      value={employer.postcode}
                      onChange={(e) => updatePreviousEmployer(index, 'postcode', e.target.value)}
                      placeholder="Postcode"
                    />
                  </div>
                  <div>
                    <Label>Telephone Number *</Label>
                    <Input
                      value={employer.telephone}
                      onChange={(e) => updatePreviousEmployer(index, 'telephone', e.target.value)}
                      placeholder="Contact Number"
                    />
                  </div>
                  <div>
                    <Label>From *</Label>
                    <Input
                      type="date"
                      value={employer.from}
                      onChange={(e) => updatePreviousEmployer(index, 'from', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>To *</Label>
                    <Input
                      type="date"
                      value={employer.to}
                      onChange={(e) => updatePreviousEmployer(index, 'to', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Leaving date or notice (if relevant)</Label>
                    <Input
                      type="date"
                      value={employer.leavingDate}
                      onChange={(e) => updatePreviousEmployer(index, 'leavingDate', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Key Tasks/Responsibilities</Label>
                  <Textarea
                    value={employer.keyTasks}
                    onChange={(e) => updatePreviousEmployer(index, 'keyTasks', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Reason for leaving *</Label>
                  <Textarea
                    value={employer.reasonForLeaving}
                    onChange={(e) => updatePreviousEmployer(index, 'reasonForLeaving', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Employment History</h3>
        <p className="text-muted-foreground mb-6">Since you haven't been previously employed, we'll move to character references.</p>
      </div>
    </div>
  );
}