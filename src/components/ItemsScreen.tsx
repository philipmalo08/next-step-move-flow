import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Minus, Package, ArrowRight, Home, ChefHat, Bed, Sofa } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  category: string;
  weight: number; // in pounds
  volume: number; // in cubic feet
  quantity: number;
}

interface CustomItem {
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
}

const predefinedItems: Omit<Item, 'id' | 'quantity'>[] = [
  // Bedroom
  { name: 'Queen Bed', category: 'Bedroom', weight: 150, volume: 35 },
  { name: 'King Bed', category: 'Bedroom', weight: 200, volume: 50 },
  { name: 'Dresser', category: 'Bedroom', weight: 100, volume: 25 },
  { name: 'Nightstand', category: 'Bedroom', weight: 30, volume: 8 },
  { name: 'Wardrobe', category: 'Bedroom', weight: 150, volume: 40 },
  
  // Living Room
  { name: 'Sofa (3-seat)', category: 'Living Room', weight: 120, volume: 45 },
  { name: 'Coffee Table', category: 'Living Room', weight: 40, volume: 12 },
  { name: 'TV Stand', category: 'Living Room', weight: 60, volume: 15 },
  { name: 'Bookshelf', category: 'Living Room', weight: 80, volume: 20 },
  { name: 'Armchair', category: 'Living Room', weight: 60, volume: 20 },
  
  // Kitchen
  { name: 'Refrigerator', category: 'Kitchen', weight: 250, volume: 25 },
  { name: 'Washing Machine', category: 'Kitchen', weight: 180, volume: 18 },
  { name: 'Dining Table', category: 'Kitchen', weight: 80, volume: 30 },
  { name: 'Dining Chair', category: 'Kitchen', weight: 25, volume: 6 },
  { name: 'Kitchen Island', category: 'Kitchen', weight: 200, volume: 35 },
  
  // Office
  { name: 'Desk', category: 'Office', weight: 70, volume: 20 },
  { name: 'Office Chair', category: 'Office', weight: 35, volume: 10 },
  { name: 'Filing Cabinet', category: 'Office', weight: 60, volume: 12 },
  { name: 'Computer Monitor', category: 'Office', weight: 15, volume: 3 }
];

interface ItemsScreenProps {
  onNext: (items: Item[]) => void;
  onBack: () => void;
}

const categoryIcons = {
  'Bedroom': Bed,
  'Living Room': Sofa,
  'Kitchen': ChefHat,
  'Office': Home
};

export function ItemsScreen({ onNext, onBack }: ItemsScreenProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [customItem, setCustomItem] = useState<CustomItem>({
    name: '',
    length: 0,
    width: 0,
    height: 0,
    weight: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const updateQuantity = (itemData: Omit<Item, 'id' | 'quantity'>, change: number) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.name === itemData.name && item.category === itemData.category
      );
      
      if (existingIndex >= 0) {
        const newItems = [...prev];
        const newQuantity = Math.max(0, newItems[existingIndex].quantity + change);
        
        if (newQuantity === 0) {
          newItems.splice(existingIndex, 1);
        } else {
          newItems[existingIndex].quantity = newQuantity;
        }
        
        return newItems;
      } else if (change > 0) {
        return [...prev, {
          id: Date.now().toString(),
          ...itemData,
          quantity: 1
        }];
      }
      
      return prev;
    });
  };

  const addCustomItem = () => {
    if (customItem.name && customItem.weight > 0) {
      const volume = (customItem.length * customItem.width * customItem.height) / 1728; // Convert cubic inches to cubic feet
      
      setItems(prev => [...prev, {
        id: Date.now().toString(),
        name: customItem.name,
        category: 'Custom',
        weight: customItem.weight,
        volume: volume,
        quantity: 1
      }]);
      
      setCustomItem({ name: '', length: 0, width: 0, height: 0, weight: 0 });
      setIsDialogOpen(false);
    }
  };

  const getItemQuantity = (itemData: Omit<Item, 'id' | 'quantity'>) => {
    const item = items.find(item => 
      item.name === itemData.name && item.category === itemData.category
    );
    return item?.quantity || 0;
  };

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const categories = Array.from(new Set(predefinedItems.map(item => item.category)));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">What items are you moving?</h2>
        <p className="text-muted-foreground">Select your items to get an accurate quote</p>
      </div>

      {/* Summary Card */}
      {totalItems > 0 && (
        <Card className="p-4 bg-gradient-primary/5 border-primary/20 animate-fade-in-up">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-lg font-bold">{totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Weight</p>
              <p className="text-lg font-bold">{totalWeight.toLocaleString()} lbs</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Volume</p>
              <p className="text-lg font-bold">{totalVolume.toFixed(1)} ft³</p>
            </div>
          </div>
        </Card>
      )}

      {/* Categories */}
      <div className="space-y-8">
        {categories.map(category => {
          const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Package;
          const categoryItems = predefinedItems.filter(item => item.category === category);
          
          return (
            <Card key={category} className="p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <IconComponent className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">{category}</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map(item => {
                  const quantity = getItemQuantity(item);
                  
                  return (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.weight} lbs • {item.volume} ft³
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Custom Items */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Custom Items</h3>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4" />
                Add Custom Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Item</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Input
                  placeholder="Item name"
                  value={customItem.name}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                />
                
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Length (ft)"
                    value={customItem.length || ''}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, length: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Width (ft)"
                    value={customItem.width || ''}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, width: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Height (ft)"
                    value={customItem.height || ''}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, height: Number(e.target.value) }))}
                  />
                </div>
                
                <Input
                  type="number"
                  placeholder="Weight (lbs)"
                  value={customItem.weight || ''}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, weight: Number(e.target.value) }))}
                />
                
                <Button onClick={addCustomItem} className="w-full">
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {items.filter(item => item.category === 'Custom').length > 0 && (
          <div className="space-y-2">
            {items.filter(item => item.category === 'Custom').map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.weight} lbs • {item.volume.toFixed(1)} ft³
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={() => onNext(items)}
          disabled={totalItems === 0}
          className="group"
        >
          Get Quote
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </div>
    </div>
  );
}