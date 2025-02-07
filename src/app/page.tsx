"use client";

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Tag, Edit2, Check, X } from 'lucide-react';
import _ from 'lodash';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface FileData {
  id: string;
  name: string;
  url: string;
  file_path: string;
  tags: string[];
  notebooklm?: string;
  created_time?: string;
}

interface SubSection {
  name: string;
  path: string;
  files: FileData[];
}

interface Section {
  name: string;
  files: FileData[];
  subsections: Record<string, SubSection>;
}

interface FileCardProps {
  file: FileData;
}

interface SectionProps {
  section: Section;
}

const DriveCatalog = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTags, setShowTags] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', tags: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files${searchTerm ? `?search=${searchTerm}` : ''}`);
      const result = await response.json();
      if (result.status === 'success') {
        setSections(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };

  const debouncedFetch = _.debounce(fetchData, 300);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [searchTerm]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update`, { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setIsLoading(false);
  };

  const startEditing = (file: FileData) => {
    setEditingFile(file.id);
    setEditForm({
      name: file.name,
      tags: file.tags.join(', ')
    });
  };

  const cancelEditing = () => {
    setEditingFile(null);
    setEditForm({ name: '', tags: '' });
  };

  const saveFileChanges = async (file: FileData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        await fetchData();
        cancelEditing();
      }
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const FileCard: React.FC<FileCardProps> = ({ file }) => (
    <Card>
      <CardContent className="p-4">
        {editingFile === file.id ? (
          <div className="space-y-3">
            <Input
              type="text"
              value={editForm.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              type="text"
              value={editForm.tags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Tags (comma-separated)"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => saveFileChanges(file)}
                variant="default"
                size="icon"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                onClick={cancelEditing}
                variant="neutral"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <a href={file.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-text hover:text-main font-medium">
                {file.name}
              </a>
              <Button
                onClick={() => startEditing(file)}
                variant="noShadow"
                size="icon"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            {showTags && file.tags && file.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {file.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 border-2 border-border rounded-base text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 text-sm text-muted-foreground">{file.file_path}</div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const Section: React.FC<SectionProps> = ({ section }) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">{section.name}</h2>
      <ScrollArea className="h-96 rounded-xl border-2 border-border p-4 bg-bw">
        <div className="space-y-4">
          {section.files.map((file, idx) => (
            <FileCard key={idx} file={file} />
          ))}
          {Object.values(section.subsections || {}).map((subsection, idx) => (
            <div key={idx} className="mt-4">
              <h3 className="text-lg font-semibold mb-3">{subsection.name}</h3>
              <div className="space-y-4">
                {subsection.files.map((file, fileIdx) => (
                  <FileCard key={fileIdx} file={file} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="bg-white dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] container mx-auto px-4 py-8 font-base">
      <div className="flex items-center justify-between mb-8">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            className="pl-10 border-2 border-border"
            placeholder="Search files, tags, or paths..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 ml-4">
          <Button
            onClick={handleRefresh}
            variant="default"
            size="icon"
            disabled={isLoading}
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section, idx) => (
          <Section key={idx} section={section} />
        ))}
      </div>
    </div>
  );
};

export default DriveCatalog;