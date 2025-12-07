"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Edit, BookOpen } from "lucide-react";
import { TemplateDialog } from "./TemplateDialog";

export default function StoryTemplatesPage() {
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const templates = useQuery(api.ai_stories.queries.getAdminTemplates);

    const filteredTemplates = templates?.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase()) ||
        t.storyType.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (id: string) => {
        setSelectedTemplateId(id);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedTemplateId(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold">Story Templates</h1>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!templates ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredTemplates?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No templates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTemplates?.map((template: any) => (
                                <TableRow key={template._id}>
                                    <TableCell className="font-medium">{template.title}</TableCell>
                                    <TableCell className="capitalize">{template.storyType}</TableCell>
                                    <TableCell className="capitalize">{template.periodType}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{template.slug}</TableCell>
                                    <TableCell>
                                        <Badge variant={template.isActive ? "default" : "secondary"}>
                                            {template.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(template.updatedAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(template._id)}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <TemplateDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                templateId={selectedTemplateId}
            />
        </div>
    );
}
