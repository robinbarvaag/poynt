"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";

interface Module {
  title: string;
  videoUrl?: string;
  resources?: Array<{
    title: string;
    file?: {
      url: string;
      filename: string;
    };
  }>;
}

interface CourseContent {
  title: string;
  modules: Module[];
}

interface Product {
  name: string;
}

interface CoursePlayerProps {
  product: Product;
  content: CourseContent;
}

export function CoursePlayer({ product, content }: CoursePlayerProps) {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set([0])
  );

  const activeModule = content.modules[activeModuleIndex];

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">{product.name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video player */}
        <div className="lg:col-span-2">
          {activeModule?.videoUrl ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
              {/* YouTube/Vimeo embed eller video player */}
              {activeModule.videoUrl.includes("youtube.com") ||
              activeModule.videoUrl.includes("youtu.be") ? (
                <iframe
                  src={activeModule.videoUrl.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeModule.videoUrl}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6">
              <p className="text-muted-foreground">
                Ingen video for denne modulen
              </p>
            </div>
          )}

          <h2 className="text-2xl font-semibold mb-4">{activeModule?.title}</h2>

          {activeModule?.resources && activeModule.resources.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Ressursar</h3>
              <div className="space-y-2">
                {activeModule.resources.map((resource, idx) => (
                  <a
                    key={idx}
                    href={
                      typeof resource.file === "object"
                        ? resource.file?.url
                        : ""
                    }
                    download
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>{resource.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Module list */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4 sticky top-4">
            <h3 className="font-semibold mb-4">Kursinnhald</h3>
            <div className="space-y-2">
              {content.modules.map((module, index) => (
                <div key={index} className="border-b last:border-b-0 pb-2">
                  <button
                    onClick={() => {
                      setActiveModuleIndex(index);
                      toggleModule(index);
                    }}
                    className={`w-full text-left flex items-center gap-2 p-2 rounded transition-colors ${
                      activeModuleIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {expandedModules.has(index) ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{module.title}</span>
                  </button>
                  {expandedModules.has(index) && module.resources && (
                    <div className="ml-6 mt-2 space-y-1">
                      {module.resources.map((resource, resourceIdx) => (
                        <div
                          key={resourceIdx}
                          className="text-xs text-muted-foreground"
                        >
                          • {resource.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
