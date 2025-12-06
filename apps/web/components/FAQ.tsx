import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
    {
        question: "What is EZ Financial?",
        answer: "EZ Financial is a comprehensive financial management platform designed for startups and small businesses. We help you track expenses, manage cash flow, and generate insights to grow your business.",
    },
    {
        question: "Is there a free trial?",
        answer: "Yes! All plans come with a 14-day free trial. You can explore all features without any commitment. No credit card is required to start your trial.",
    },
    {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Absolutely. You can change your plan at any time from your account settings. Changes will be applied immediately, and we'll prorate any payments.",
    },
    {
        question: "Is my data secure?",
        answer: "Security is our top priority. We use bank-level encryption to protect your data and adhere to strict privacy standards. We never sell your data to third parties.",
    },
    {
        question: "Do you support multi-user access?",
        answer: "Yes, our Pro plan supports up to 10 users with different role-based access controls, making it perfect for growing teams.",
    },
];

export function FAQ() {
    return (
        <section className="py-24 bg-background">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Frequently asked questions</h2>
                    <p className="text-muted-foreground">
                        Hopefully we can answer all your questions here.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {FAQS.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
