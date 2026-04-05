export default function Home() {
  return (
    <div className="bg-dotted-grid min-h-screen overflow-hidden">
      <div className="bg-red-500 w-72 m-12 p-4 rounded-lg shadow-lg h-[calc(100vh-6rem)]">
        <p className="font-bold text-lg">Add Component</p>
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div className="w-full h-16 bg-blue-300"></div>
          <div className="w-full h-16 bg-blue-300"></div>
          <div className="w-full h-16 bg-blue-300"></div>
          <div className="w-full h-16 bg-blue-300"></div>
        </div>
      </div>
    </div>
  );
}
