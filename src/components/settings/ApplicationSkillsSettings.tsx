import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface SkillsCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface Skill {
  id: string;
  category_id: string | null;
  name: string;
  is_active: boolean;
  display_order: number;
}

export function ApplicationSkillsSettings() {
  const [categories, setCategories] = useState<SkillsCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillsCategory | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const { toast } = useToast();

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    display_order: 0
  });

  const [skillFormData, setSkillFormData] = useState({
    category_id: '',
    name: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesResponse, skillsResponse] = await Promise.all([
        supabase.from('application_skills_categories').select('*').order('display_order'),
        supabase.from('application_skills').select('*').order('display_order')
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (skillsResponse.error) throw skillsResponse.error;

      setCategories(categoriesResponse.data || []);
      setSkills(skillsResponse.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch skills data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('application_skills_categories')
          .update(categoryFormData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        const { error } = await supabase
          .from('application_skills_categories')
          .insert([categoryFormData]);

        if (error) throw error;
        toast({ title: "Success", description: "Category created successfully" });
      }

      setShowCategoryDialog(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive"
      });
    }
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSkill) {
        const { error } = await supabase
          .from('application_skills')
          .update(skillFormData)
          .eq('id', editingSkill.id);

        if (error) throw error;
        toast({ title: "Success", description: "Skill updated successfully" });
      } else {
        const { error } = await supabase
          .from('application_skills')
          .insert([skillFormData]);

        if (error) throw error;
        toast({ title: "Success", description: "Skill created successfully" });
      }

      setShowSkillDialog(false);
      setEditingSkill(null);
      resetSkillForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save skill",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = (category: SkillsCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
      display_order: category.display_order
    });
    setShowCategoryDialog(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillFormData({
      category_id: skill.category_id || '',
      name: skill.name,
      is_active: skill.is_active,
      display_order: skill.display_order
    });
    setShowSkillDialog(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('application_skills_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('application_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Skill deleted successfully" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive"
      });
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      is_active: true,
      display_order: categories.length
    });
  };

  const resetSkillForm = () => {
    setSkillFormData({
      category_id: '',
      name: '',
      is_active: true,
      display_order: skills.length
    });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Tabs defaultValue="categories" className="w-full">
      <TabsList>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Skills Categories</CardTitle>
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCategory(null);
                    resetCategoryForm();
                    setShowCategoryDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : 'Create New Category'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cat-name">Name</Label>
                      <Input
                        id="cat-name"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat-description">Description</Label>
                      <Input
                        id="cat-description"
                        value={categoryFormData.description}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat-order">Display Order</Label>
                      <Input
                        id="cat-order"
                        type="number"
                        value={categoryFormData.display_order}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, display_order: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="cat-active"
                        checked={categoryFormData.is_active}
                        onCheckedChange={(checked) => setCategoryFormData({ ...categoryFormData, is_active: checked })}
                      />
                      <Label htmlFor="cat-active">Active</Label>
                    </div>
                    <Button type="submit">
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell>
                      <Switch checked={category.is_active} disabled />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="skills">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Skills</CardTitle>
              <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingSkill(null);
                    resetSkillForm();
                    setShowSkillDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSkill ? 'Edit Skill' : 'Create New Skill'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSkillSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="skill-category">Category</Label>
                      <Select
                        value={skillFormData.category_id}
                        onValueChange={(value) => setSkillFormData({ ...skillFormData, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="skill-name">Name</Label>
                      <Input
                        id="skill-name"
                        value={skillFormData.name}
                        onChange={(e) => setSkillFormData({ ...skillFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="skill-order">Display Order</Label>
                      <Input
                        id="skill-order"
                        type="number"
                        value={skillFormData.display_order}
                        onChange={(e) => setSkillFormData({ ...skillFormData, display_order: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="skill-active"
                        checked={skillFormData.is_active}
                        onCheckedChange={(checked) => setSkillFormData({ ...skillFormData, is_active: checked })}
                      />
                      <Label htmlFor="skill-active">Active</Label>
                    </div>
                    <Button type="submit">
                      {editingSkill ? 'Update' : 'Create'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-medium">{skill.name}</TableCell>
                    <TableCell>{getCategoryName(skill.category_id)}</TableCell>
                    <TableCell>{skill.display_order}</TableCell>
                    <TableCell>
                      <Switch checked={skill.is_active} disabled />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSkill(skill)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSkill(skill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}