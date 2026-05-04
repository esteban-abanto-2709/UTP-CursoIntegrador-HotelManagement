import Cronograma from "./Cronograma";

export default function TemporalPage() {
  return (
    <div className="fixed inset-0 z-[9999] p-4 bg-[#0a0f1d] overflow-hidden flex justify-center items-center">
      <div className="w-full h-full max-w-[1900px] flex justify-center items-center">
        <Cronograma />
      </div>
    </div>
  );
}
