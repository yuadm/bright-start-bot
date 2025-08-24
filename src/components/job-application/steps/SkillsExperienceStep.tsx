import { useState, useEffect } from 'react';
import { SkillsExperience } from '../types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface SkillsExperienceStepProps {
  data: SkillsExperience;
  updateData: (field: keyof SkillsExperience, value: Record<string, 'Good' | 'Basic' | 'None'>) => void;
}

interface SkillsCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Skill {
  id: string;
  category_id: string | null;
  name: string;
}

interface SkillsByCategory {
  [categoryName: string]: Skill[];
}

export function SkillsExperienceStep({ data, updateData }: SkillsExperienceStepProps) {
  const [skillsByCategory, setSkillsByCategory] = useState<SkillsByCategory>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const [categoriesResponse, skillsResponse] = await Promise.all([
        supabase.from('application_skills_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('application_skills').select('*').eq('is_active', true).order('display_order')
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (skillsResponse.error) throw skillsResponse.error;

      const categories = categoriesResponse.data || [];
      const skills = skillsResponse.data || [];

      // Group skills by category
      const grouped: SkillsByCategory = {};
      
      categories.forEach(category => {
        grouped[category.name] = skills.filter(skill => skill.category_id === category.id);
      });

      // Add uncategorized skills
      const uncategorizedSkills = skills.filter(skill => !skill.category_id);
      if (uncategorizedSkills.length > 0) {
        grouped['Other'] = uncategorizedSkills;
      }

      setSkillsByCategory(grouped);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkillsByCategory({});
    } finally {
      setLoading(false);
    }
  };
  const handleSkillChange = (skill: string, level: 'Good' | 'Basic' | 'None') => {
    updateData('skills', { ...data.skills, [skill]: level });
  };

  if (loading) {
    return <div>Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Skills & Experience</h3>
        <p className="text-muted-foreground mb-6">Please indicate if you have skills and experience in the following areas.</p>
      </div>

      <div className="space-y-6">
        {Object.entries(skillsByCategory).map(([categoryName, skills]) => (
          <Card key={categoryName} className="border">
            <CardHeader>
              <CardTitle className="text-base">{categoryName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map(skill => (
                <div key={skill.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Label className="font-medium text-sm flex-1">{skill.name}</Label>
                  <div className="flex gap-2">
                    {(['Good', 'Basic', 'None'] as const).map(level => (
                      <Button
                        key={level}
                        variant={data.skills?.[skill.name] === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSkillChange(skill.name, level)}
                        className="min-w-[60px]"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}