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
import type { TranscriptionResponse, Speaker } from "@/lib/types";

interface ExportButtonProps {
  transcription: TranscriptionResponse;
}

export function ExportButton({ transcription }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatTextWithSpeakers = () => {
    if (transcription.speakers && transcription.speakers.length > 0) {
      return transcription.speakers
        .map(speaker => `Спикер ${speaker.speaker + 1}:\n${speaker.text}`)
        .join('\n\n');
    }
    if (transcription.paragraphs && transcription.paragraphs.length > 0) {
      return transcription.paragraphs.join('\n\n');
    }
    return transcription.transcript;
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      // Создаем HTML разметку для PDF
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { font-size: 24px; text-align: center; margin-bottom: 30px; }
            .speaker { margin-bottom: 20px; }
            .speaker-header { font-weight: bold; margin-bottom: 10px; }
            .speaker-text { margin-left: 20px; line-height: 1.5; }
            .paragraph { margin-bottom: 15px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>Транскрипция</h1>
      `;

      if (transcription.speakers && transcription.speakers.length > 0) {
        htmlContent += transcription.speakers.map(speaker => `
          <div class="speaker">
            <div class="speaker-header">Спикер ${speaker.speaker + 1}:</div>
            <div class="speaker-text">${speaker.text}</div>
          </div>
        `).join('');
      } else if (transcription.paragraphs && transcription.paragraphs.length > 0) {
        htmlContent += transcription.paragraphs.map(paragraph => `
          <div class="paragraph">${paragraph}</div>
        `).join('');
      } else {
        htmlContent += `<div class="paragraph">${transcription.transcript}</div>`;
      }

      htmlContent += `
        </body>
        </html>
      `;

      // Конвертируем HTML в PDF через API endpoint
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
      saveAs(blob, "transcription.pdf");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsDocx = async () => {
    setIsExporting(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Транскрипция",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 400,
                line: 360,
              },
            }),
            ...(transcription.speakers?.map((speaker) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Спикер ${speaker.speaker + 1}:`,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: speaker.text,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 300,
                },
              }),
            ]).flat() || transcription.paragraphs?.map((para) => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: para,
                    size: 24,
                  }),
                ],
                spacing: {
                  before: 200,
                  after: 200,
                },
              })
            ) || [
              new Paragraph({
                children: [
                  new TextRun({
                    text: transcription.transcript,
                    size: 24,
                  }),
                ],
              }),
            ]),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "transcription.docx");
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
      saveAs(blob, "transcription.txt");
    } catch (error) {
      console.error("Error exporting to TXT:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Экспорт
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