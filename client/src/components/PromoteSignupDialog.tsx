import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

interface PromoteSignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromoteSignupDialog({ open, onOpenChange }: PromoteSignupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Получите 30 минут бесплатной транскрибации
          </DialogTitle>
          <DialogDescription>
            Зарегистрируйтесь и получите 30 минут бесплатной транскрибации каждый месяц.
            Ваши транскрипции будут сохранены в личном кабинете.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <Link href="/auth?mode=register" className="flex-1">
            <Button className="w-full">Зарегистрироваться</Button>
          </Link>
          <Link href="/auth?mode=login" className="flex-1">
            <Button variant="outline" className="w-full">Войти</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
