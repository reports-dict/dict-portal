import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type CsvExportButtonProps = {
    url: string;
    filename: string;
    label?: string;
};

export function CsvExportButton({
    url,
    filename,
    label = 'Export CSV',
}: CsvExportButtonProps) {
    const [downloading, setDownloading] = useState(false);

    async function handleClick() {
        setDownloading(true);

        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(objectUrl);
        } finally {
            setDownloading(false);
        }
    }

    return (
        <Button
            variant="secondary"
            size="sm"
            onClick={handleClick}
            disabled={downloading}
        >
            <Download className="h-3.5 w-3.5" />
            {downloading ? 'Exporting…' : label}
        </Button>
    );
}
