import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, X, ArrowLeft, ArrowRight } from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string;
  weight: number;
  volume: number;
  quantity: number;
  emoji?: string;
}

interface CustomItem {
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
}

// Item catalog with predefined items and their properties (volume in cu ft, weight in lbs)
const itemCatalog: Record<string, Array<{id: string; name: string; volume: number; weight: number; emoji: string}>> = {
  "Bedroom": [],
  "Living Room": [],
  "Kitchen": [],
  "Office": [],
  "Appliances": [],
  "Miscellaneous": []
};

// Populate itemCatalog from the user's itemData
const rawItemData = {
  // Bedroom
  "queenBedFrame": { emoji: "🛏️", name: "Queen Bed Frame", volume: 35, weight: 125, category: "Bedroom" },
  "queenMattress": { emoji: "🛌", name: "Queen Mattress", volume: 65, weight: 85, category: "Bedroom" },
  "nightstand": { emoji: "🗃️", name: "Nightstand", volume: 8, weight: 40, category: "Bedroom" },
  "dresser6Drawer": { emoji: "🗄️", name: "Dresser (6-drawer)", volume: 40, weight: 150, category: "Bedroom" },
  "chestOfDrawers": { emoji: "🗄️", name: "Chest of Drawers", volume: 40, weight: 150, category: "Bedroom" },
  "mirrorLarge": { emoji: "🪞", name: "Mirror (Large)", volume: 8, weight: 35, category: "Bedroom" },
  "wardrobe": { emoji: "👚", name: "Wardrobe", volume: 63, weight: 225, category: "Bedroom" },
  "crib": { emoji: "👶", name: "Crib", volume: 20, weight: 60, category: "Bedroom" },

  // Living Room
  "sofa3Seater": { emoji: "🛋️", name: "Sofa (3-seater)", volume: 52, weight: 200, category: "Living Room" },
  "loveseat": { emoji: "🛋️", name: "Loveseat", volume: 38, weight: 125, category: "Living Room" },
  "recliner": { emoji: "💺", name: "Recliner", volume: 28, weight: 88, category: "Living Room" },
  "coffeeTable": { emoji: "☕", name: "Coffee Table", volume: 15, weight: 63, category: "Living Room" },
  "endTable": { emoji: "🗄️", name: "End Table", volume: 8, weight: 30, category: "Living Room" },
  "tvStandConsole": { emoji: "📺", name: "TV Stand/Console", volume: 20, weight: 95, category: "Living Room" },
  "entertainmentCenter": { emoji: "🎮", name: "Entertainment Center", volume: 75, weight: 225, category: "Living Room" },
  "flatScreenTv55": { emoji: "🖥️", name: "Flat Screen TV (55'')", volume: 13, weight: 48, category: "Living Room" },
  "cabinet": { emoji: "🏺", name: "Cabinet", volume: 50, weight: 225, category: "Living Room" },
  "buffetSideboard": { emoji: "🍽️", name: "Buffet/Sideboard", volume: 33, weight: 160, category: "Living Room" },

  // Kitchen
  "diningTable6Person": { emoji: "🍽️", name: "Dining Table (6-person)", volume: 40, weight: 150, category: "Kitchen" },
  "diningChair": { emoji: "🪑", name: "Dining Chair", volume: 6, weight: 20, category: "Kitchen" },
  "refrigeratorFullSize": { emoji: "❄️", name: "Refrigerator (Full-size)", volume: 58, weight: 300, category: "Kitchen" },
  "microwave": { emoji: "♨️", name: "Microwave", volume: 8, weight: 40, category: "Kitchen" },
  "kitchenCartIsland": { emoji: "🛒", name: "Kitchen Cart/Island", volume: 20, weight: 75, category: "Kitchen" },

  // Office
  "officeDeskStandard": { emoji: "🧑‍💻", name: "Office Desk (Standard)", volume: 30, weight: 140, category: "Office" },
  "officeChair": { emoji: "🪑", name: "Office Chair", volume: 13, weight: 40, category: "Office" },
  "filingCabinet2Drawer": { emoji: "🗄️", name: "Filing Cabinet (2-drawer)", volume: 20, weight: 100, category: "Office" },
  "bookcaseLarge": { emoji: "📚", name: "Bookcase (Large)", volume: 33, weight: 150, category: "Office" },
  "bookshelfMedium": { emoji: "📚", name: "Bookshelf (Medium)", volume: 25, weight: 80, category: "Office" },
  "printerScanner": { emoji: "🖨️", name: "Printer/Scanner", volume: 8, weight: 28, category: "Office" },

  // Appliances
  "washer": { emoji: "🌀", name: "Washer", volume: 25, weight: 175, category: "Appliances" },
  "dryer": { emoji: "🔁", name: "Dryer", volume: 25, weight: 125, category: "Appliances" },

  // Miscellaneous
  "shoeRack": { emoji: "👟", name: "Shoe Rack", volume: 8, weight: 20, category: "Miscellaneous" },
  "laundryBasket": { emoji: "🧺", name: "Laundry Basket", volume: 8, weight: 15, category: "Miscellaneous" },
  "storageBinPlastic": { emoji: "🗃️", name: "Storage Bin (Plastic)", volume: 10, weight: 20, category: "Miscellaneous" },
  "foldingChair": { emoji: "🪑", name: "Folding Chair", volume: 3, weight: 13, category: "Miscellaneous" },
  "bicycle": { emoji: "🚲", name: "Bicycle", volume: 20, weight: 33, category: "Miscellaneous" },
  "vacuumCleaner": { emoji: "🧹", name: "Vacuum Cleaner", volume: 8, weight: 20, category: "Miscellaneous" },
  "floorLamp": { emoji: "💡", name: "Floor Lamp", volume: 5, weight: 15, category: "Miscellaneous" },
  "packedBox": { emoji: "📦", name: "Packed Box", volume: 2, weight: 30, category: "Miscellaneous" }
};

// Transform rawItemData into the itemCatalog structure grouped by category
for (const key in rawItemData) {
  const item = rawItemData[key];
  if (itemCatalog[item.category]) {
    itemCatalog[item.category].push({
      id: key,
      name: item.name,
      volume: item.volume,
      weight: item.weight,
      emoji: item.emoji
    });
  }
}

interface ItemsScreenProps {
  onNext: (items: Item[]) => void;
  onBack: () => void;
}

export const ItemsScreen = ({ onNext, onBack }: ItemsScreenProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [customItem, setCustomItem] = useState<CustomItem>({ name: '', length: 0, width: 0, height: 0, weight: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const updateQuantity = (itemData: Omit<Item, 'id' | 'quantity'>, change: number) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.name === itemData.name);
      
      if (existingIndex >= 0) {
        const newQuantity = prev[existingIndex].quantity + change;
        if (newQuantity <= 0) {
          return prev.filter((_, index) => index !== existingIndex);
        }
        
        const newItems = [...prev];
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQuantity };
        return newItems;
      } else if (change > 0) {
        return [...prev, {
          id: Date.now().toString(),
          ...itemData,
          quantity: change
        }];
      }
      
      return prev;
    });
  };

  const addCustomItem = () => {
    if (customItem.name && customItem.weight > 0) {
      const volume = customItem.length * customItem.width * customItem.height;
      const newItem: Item = {
        id: Date.now().toString(),
        name: customItem.name,
        category: 'Custom',
        weight: customItem.weight,
        volume: volume,
        quantity: 1,
        emoji: "📦"
      };
      setItems(prev => [...prev, newItem]);
      setCustomItem({ name: '', length: 0, width: 0, height: 0, weight: 0 });
      setIsDialogOpen(false);
    }
  };

  const getItemQuantity = (itemData: Omit<Item, 'id' | 'quantity'>) => {
    return items.find(item => item.name === itemData.name)?.quantity || 0;
  };

  // Calculate totals
  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const customItems = items.filter(item => item.category === 'Custom');

  return (
    <div className="min-h-screen bg-gradient-background px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl sm:text-2xl">What items are you moving?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {totalItems > 0 && (
              <Card className="bg-accent/50 border-0">
                <CardContent className="pt-4 pb-4">
                  <div className="text-center">
                    <h3 className="font-semibold mb-3 text-lg">Current Selection</h3>
                    <div className="text-2xl font-bold text-primary">
                      {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {Object.entries(itemCatalog).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">{category}</h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    const quantity = getItemQuantity({...item, category});
                    return (
                      <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.emoji}</span>
                          <span className="font-medium text-sm sm:text-base">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity({...item, category}, -1)}
                            disabled={quantity === 0}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity({...item, category}, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Custom Items</h3>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom
                </Button>
              </div>

              {customItems.length > 0 && (
                <div className="space-y-2">
                  {customItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📦</span>
                        <div>
                          <span className="font-medium text-sm">{item.name}</span>
                          <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setItems(prev => prev.filter(i => i.id !== item.id));
                        }}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-6">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => onNext(items)}
                disabled={totalItems === 0}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Get Quote
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={customItem.name}
                onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="length">Length (ft)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={customItem.length}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (ft)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={customItem.width}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (ft)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={customItem.height}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={customItem.weight}
                onChange={(e) => setCustomItem(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={addCustomItem}
              disabled={!customItem.name || customItem.weight <= 0}
              className="flex-1"
            >
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};