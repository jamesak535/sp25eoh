 // src/components/MarvinJSEditor.tsx
 import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MarvinEditorRef } from "@/types";
import { toast } from "sonner";

interface MarvinJSEditorProps {
  onStructureChange?: (smiles: string | null) => void;
}

const MarvinJSEditor = forwardRef<MarvinEditorRef, MarvinJSEditorProps>(
  ({ onStructureChange }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const handleLoad = () => {
        const iframeWindow = iframe.contentWindow as any;

        const wait = setInterval(() => {
          const sketcher = iframeWindow?.marvin?.sketcherInstance;

          if (sketcher) {
            clearInterval(wait);

            // 구조 변경 감지
            sketcher.on("molchange", () => {
              sketcher.exportStructure("mol").then((smiles: string) => {
                if (onStructureChange) onStructureChange(smiles || null);
              });
            });

            toast.success("🧪 MarvinJS 로드 완료!");
          }
        }, 300);
      };

      iframe.addEventListener("load", handleLoad);
      return () => {
        iframe.removeEventListener("load", handleLoad);
      };
    }, [onStructureChange]);

    useImperativeHandle(ref, () => ({
      exportStructure: async (format = "mol") => {
        const iframeWindow = iframeRef.current?.contentWindow as any;
        const sketcher = iframeWindow?.marvin?.sketcherInstance;
        return sketcher ? await sketcher.exportStructure(format) : "";
      },
      importStructure: async (data: string, format = "mol") => {
        const iframeWindow = iframeRef.current?.contentWindow as any;
        const sketcher = iframeWindow?.marvin?.sketcherInstance;
        if (sketcher) await sketcher.importStructure(format, data);
      },
      clear: () => {
        const iframeWindow = iframeRef.current?.contentWindow as any;
        const sketcher = iframeWindow?.marvin?.sketcherInstance;
        sketcher?.clear();
      },
    }));

    return (
      <Card className="w-full">
        <CardContent className="p-2"
  style={{
    position: "relative",  // 👉 기준 잡기
    zIndex: 0,              // 👉 iframe보다 낮게
    overflow: "auto",       // 👉 구조가 커져도 scroll 가능
  }}
        >
          <iframe
            ref={iframeRef}
            title="MarvinJS Editor"
            src="/marvinjs/editorws.html"
            width="100%"
            height="500px"
            style={{
              border: "1px solid #ccc",
              position: "relative",
              zIndex: 0,           // ✅ 가장 뒤로
              pointerEvents: "auto"
            }}
            
          />
        </CardContent>
      </Card>
    );
  }
);

MarvinJSEditor.displayName = "MarvinJSEditor";
export default MarvinJSEditor;