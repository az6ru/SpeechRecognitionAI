import { useState } from "react";
import { Save } from "lucide-react";
import { jsPDF } from "jspdf";
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
}

export function ExportButton({ transcription }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportAsPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Добавляем заголовок
      doc.setFontSize(16);
      doc.text("Транскрипция", 20, 20);
      
      // Добавляем текст транскрипции
      doc.setFontSize(12);
      
      // Разбиваем текст на строки с учетом ширины страницы
      const lines = doc.splitTextToSize(transcription.transcript, 170);
      doc.text(lines, 20, 30);
      
      // Сохраняем файл
      doc.save("transcription.pdf");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsDocx = () => {
    setIsExporting(true);
    try {
      // Создаем простой .docx файл как текстовый документ
      const blob = new Blob([transcription.transcript], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
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
      const blob = new Blob([transcription.transcript], { type: "text/plain;charset=utf-8" });
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
        <Button variant="outline" className="w-full">
          <Save className="mr-2 h-4 w-4" />
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
