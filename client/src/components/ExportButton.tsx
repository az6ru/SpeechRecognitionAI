import { useState } from "react";
import { Save } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { TranscriptionResponse } from "@/lib/types";

interface ExportButtonProps {
  transcription: TranscriptionResponse;
  title: string;
  activeTab: string;
}

export function ExportButton({ transcription, title, activeTab }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatTextWithSpeakers = () => {
    switch (activeTab) {
      case "formatted":
        return transcription.paragraphs?.join('\n\n') || transcription.transcript;
      case "speakers":
        return transcription.speakers
          ?.map(speaker => `Спикер ${speaker.speaker + 1}:\n${speaker.text}`)
          .join('\n\n');
      default:
        return transcription.transcript;
    }
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const formattedText = formatTextWithSpeakers();
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              padding: 8px 15px;
              font-size: 10px;
              line-height: 1.4;
            }
            .app-title {
              font-size: 14px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 12px;
              text-align: left;
            }
            .doc-title {
              font-size: 11px;
              font-weight: 600;
              color: #4a4a4a;
              margin-bottom: 10px;
            }
            .content { 
              margin-bottom: 6px;
              line-height: 1.4;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div class="app-title">Voice Converter - Быстрый cервис распознавания речи</div>
          <div class="doc-title">${title}</div>
          <div class="content">${formattedText}</div>
        </body>
        </html>
      `;

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      saveAs(blob, `${title}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsDocx = async () => {
    setIsExporting(true);
    try {
      const formattedText = formatTextWithSpeakers();
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Voice Converter - Быстрый cервис распознавания речи",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
                line: 360,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: {
                before: 200,
                after: 400,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: formattedText,
                  size: 24,
                }),
              ],
              spacing: {
                before: 200,
                after: 200,
              },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title}.docx`);
    } catch (error) {
      console.error("Error exporting to DOCX:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsTxt = () => {
    setIsExporting(true);
    try {
      const formattedText = formatTextWithSpeakers();
      const blob = new Blob([formattedText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `${title}.txt`);
    } catch (error) {
      console.error("Error exporting to TXT:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={isExporting}>
          <Save className="h-4 w-4" />
          {isExporting ? 'Экспорт...' : 'Экспорт'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportAsPDF} disabled={isExporting}>
          Сохранить как PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsDocx} disabled={isExporting}>
          Сохранить как DOCX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsTxt} disabled={isExporting}>
          Сохранить как TXT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}