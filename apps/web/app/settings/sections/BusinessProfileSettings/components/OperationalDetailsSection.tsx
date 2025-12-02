/**
 * Operational Details Section
 */

"use client";

import { Building2, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Product } from "../types";

interface OperationalDetailsSectionProps {
  numberOfEmployees: string;
  independentContractors: string;
  workModel: string;
  businessDescription: string;
  products: Product[];
  editingProductId: string | null;
  editingProductName: string;
  onNumberOfEmployeesChange: (value: string) => void;
  onIndependentContractorsChange: (value: string) => void;
  onWorkModelChange: (value: string) => void;
  onBusinessDescriptionChange: (value: string) => void;
  onAddProduct: () => void;
  onEditProduct: (id: string) => void;
  onSaveProduct: (id: string) => void;
  onCancelEdit: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onEditingProductNameChange: (value: string) => void;
}

export function OperationalDetailsSection({
  numberOfEmployees,
  independentContractors,
  workModel,
  businessDescription,
  products,
  editingProductId,
  editingProductName,
  onNumberOfEmployeesChange,
  onIndependentContractorsChange,
  onWorkModelChange,
  onBusinessDescriptionChange,
  onAddProduct,
  onEditProduct,
  onSaveProduct,
  onCancelEdit,
  onDeleteProduct,
  onEditingProductNameChange,
}: OperationalDetailsSectionProps) {
  return (
    <AccordionItem value="operational" className="border border-gray-200 dark:border-gray-700 rounded-md px-4">
      <AccordionTrigger className="hover:no-underline hover:text-primary">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <span className="font-semibold">Operational Details</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employees">Number of Employees</Label>
            <Input
              id="employees"
              type="number"
              value={numberOfEmployees}
              onChange={(e) => onNumberOfEmployeesChange(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractors">Independent Contractors</Label>
            <Input
              id="contractors"
              type="number"
              value={independentContractors}
              onChange={(e) => onIndependentContractorsChange(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="workModel">Work Model</Label>
            <Select value={workModel} onValueChange={onWorkModelChange}>
              <SelectTrigger id="workModel">
                <SelectValue placeholder="Select work model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="on_site">On-Site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={businessDescription}
              onChange={(e) => onBusinessDescriptionChange(e.target.value)}
              placeholder="Brief description of your business"
              rows={3}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="products">Primary Products/Services</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onAddProduct}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                No products/services added yet. Click the + icon to add one.
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {editingProductId === product.id ? (
                      <>
                        <Input
                          value={editingProductName}
                          onChange={(e) => onEditingProductNameChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onSaveProduct(product.id);
                            } else if (e.key === "Escape") {
                              onCancelEdit(product.id);
                            }
                          }}
                          className="flex-1 h-8"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onSaveProduct(product.id)}
                          className="h-7 w-7 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onCancelEdit(product.id)}
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{product.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditProduct(product.id)}
                          className="h-7 w-7"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteProduct(product.id)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

