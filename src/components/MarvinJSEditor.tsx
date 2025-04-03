
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MarvinEditorRef } from "@/types";
import { toast } from "sonner";

interface MarvinJSEditorProps {
  onStructureChange?: (smiles: string | null) => void;
}

const MarvinJSEditor = forwardRef<MarvinEditorRef, MarvinJSEditorProps>(
  ({ onStructureChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const marvinRef = useRef<any>(null);
    const sketcherInitialized = useRef(false);

    useEffect(() => {
      // Load MarvinJS
      if (!containerRef.current || sketcherInitialized.current) return;

      const script = document.createElement("script");
      script.src = "https://marvinjs-demo.chemaxon.com/latest/webservices/rest-v1/gui/lib/promise-0.1.1.min.js";
      script.async = true;
      document.body.appendChild(script);
      
      const marvinScript = document.createElement("script");
      marvinScript.src = "https://marvinjs-demo.chemaxon.com/latest/gui/lib/webservices.js";
      marvinScript.async = true;
      document.body.appendChild(marvinScript);
      
      const marvinEditorScript = document.createElement("script");
      marvinEditorScript.src = "https://marvinjs-demo.chemaxon.com/latest/gui/lib/jquery-3.6.0.min.js";
      marvinEditorScript.async = true;
      marvinEditorScript.onload = () => {
        const editorScript = document.createElement("script");
        editorScript.src = "https://marvinjs-demo.chemaxon.com/latest/gui/lib/marvin.js";
        editorScript.async = true;
        editorScript.onload = initializeMarvin;
        document.body.appendChild(editorScript);
      };
      document.body.appendChild(marvinEditorScript);

      return () => {
        try {
          document.body.removeChild(script);
          document.body.removeChild(marvinScript);
          document.body.removeChild(marvinEditorScript);
        } catch (error) {
          // Handle the case where elements might already be removed
          console.log("Cleanup error:", error);
        }
      };
    }, []);

    const initializeMarvin = () => {
      if (!containerRef.current || typeof window.MarvinJSUtil === 'undefined' || sketcherInitialized.current) return;
      
      try {
        sketcherInitialized.current = true;
        
        window.MarvinJSUtil.getEditor("#marvin-editor").then((editor: any) => {
          marvinRef.current = editor;
          
          // Set up the change listener
          editor.on("molchange", () => {
            exportStructure("smiles").then((smiles) => {
              if (onStructureChange) onStructureChange(smiles || null);
            });
          });
          
          toast.success("Chemical editor loaded");
        });
      } catch (error) {
        console.error("Error initializing MarvinJS:", error);
        toast.error("Failed to load chemical editor");
      }
    };

    const exportStructure = async (format: string = "smiles"): Promise<string> => {
      if (!marvinRef.current) return "";
      
      try {
        return await marvinRef.current.exportStructure(format);
      } catch (error) {
        console.error("Error exporting structure:", error);
        return "";
      }
    };
    
    const importStructure = async (data: string, format: string = "smiles"): Promise<void> => {
      if (!marvinRef.current) return;
      
      try {
        await marvinRef.current.importStructure(format, data);
      } catch (error) {
        console.error("Error importing structure:", error);
      }
    };
    
    const clear = () => {
      if (marvinRef.current) {
        marvinRef.current.clear();
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportStructure,
      importStructure,
      clear,
    }));

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div ref={containerRef} className="w-full">
            <div id="marvin-editor" className="marvin-container"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

MarvinJSEditor.displayName = "MarvinJSEditor";

export default MarvinJSEditor;
