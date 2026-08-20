export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-900">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-900">
          TalkFlow
        </h1>

        <p className="mt-6 text-2xl text-gray-600 font-medium">
          One place for every conversation.
        </p>

        <p className="mt-6 max-w-2xl text-lg text-gray-500">
          TalkFlow is a modern chat application connecting you with AI assistants and your friends in real time.
        </p>

        <div className="mt-10">
          <button className="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition duration-300 shadow-md">
            Get Started
          </button>
        </div>
      </main>
    </div>
  );
}
