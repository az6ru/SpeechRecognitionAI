import { useState } from "react";
import { Save } from "lucide-react";
import { jsPDF } from "jspdf";
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
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
        putOnlyUsedFonts: true,
        compress: true
      });

      // Загружаем встроенный шрифт для поддержки кириллицы
      doc.setFont("times", "normal");
      doc.setLanguage("ru");

      // Заголовок
      doc.setFontSize(24);
      const title = "Транскрипция";
      const pageWidth = doc.internal.pageSize.width;
      const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize();
      const titleX = (pageWidth - titleWidth) / 2;

      doc.text(title, titleX, 50);
      doc.setFontSize(12);

      const margin = 40;
      let y = 100;
      const lineHeight = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Добавляем текст построчно с правильным форматированием
      if (transcription.speakers && transcription.speakers.length > 0) {
        transcription.speakers.forEach((speaker: Speaker) => {
          // Заголовок спикера
          const speakerHeader = `Спикер ${speaker.speaker + 1}:`;
          doc.setFont("times", "bold");
          doc.text(speakerHeader, margin, y);
          y += lineHeight;

          // Текст спикера
          doc.setFont("times", "normal");
          const lines = doc.splitTextToSize(speaker.text, maxWidth - 20);
          lines.forEach(line => {
            if (y > doc.internal.pageSize.height - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 20, y);
            y += lineHeight;
          });
          y += lineHeight; // Дополнительный отступ между спикерами
        });
      } else {
        const paragraphs = transcription.paragraphs || [transcription.transcript];
        paragraphs.forEach(paragraph => {
          if (!paragraph.trim()) return;
          const lines = doc.splitTextToSize(paragraph, maxWidth);
          lines.forEach(line => {
            if (y > doc.internal.pageSize.height - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += lineHeight;
          });
          y += lineHeight / 2; // Отступ между абзацами
        });
      }

      doc.save("transcription.pdf");
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