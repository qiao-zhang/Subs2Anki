import { Dialog, Transition } from "@headlessui/react";
import { Fragment, JSX } from "react";
import { Transcriber } from "@/ui/hooks/useTranscriber.ts";
import LANGUAGES from "@/core/languages.ts"

export interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitText?: string;
  submitEnabled?: boolean;
  title: string | JSX.Element;
  content: string | JSX.Element;
}

export default function Modal({
  show,
  onClose,
  onSubmit,
  title,
  content,
  submitText,
  submitEnabled = true,
}: Props) {
  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <Dialog.Title
                  as='h3'
                  className='text-lg font-medium leading-6 text-gray-900'
                >
                  {title}
                </Dialog.Title>
                <div className='mt-3 text-sm text-gray-500'>
                  {content}
                </div>

                <div className='mt-4 flex flex-row-reverse'>
                  {submitText && (
                    <button
                      type='button'
                      disabled={!submitEnabled}
                      className={`inline-flex ml-4 justify-center rounded-md border border-transparent ${
                        submitEnabled
                          ? "bg-indigo-600"
                          : "bg-grey-300"
                      } px-4 py-2 text-sm font-medium text-indigo-100 ${
                        submitEnabled
                          ? "hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                          : ""
                      } transition-all duration-300`}
                      onClick={onSubmit}
                    >
                      {submitText}
                    </button>
                  )}
                  <button
                    type='button'
                    className='inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-300'
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function titleCase(str: string) {
  str = str.toLowerCase();
  return (str.match(/\w+.?/g) || [])
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

export function ModelSettingsModal(props: {
  show: boolean;
  onSubmit: (url: string) => void;
  onClose: () => void;
  transcriber: Transcriber;
}) {
  const names = Object.values(LANGUAGES).map(titleCase);

  const models = {
    // Original checkpoints
    'Xenova/whisper-tiny': [41, 152],
    'Xenova/whisper-base': [77, 291],
    'Xenova/whisper-small': [249],
    'Xenova/whisper-medium': [776],

    // Distil Whisper (English-only)
    'distil-whisper/distil-medium.en': [402],
    'distil-whisper/distil-large-v2': [767],
  };
  return (
    <Modal
      show={props.show}
      title={"Model Settings"}
      content={
        <>
          <label>Select the model to use.</label>
          <select
            className='mt-1 mb-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
            defaultValue={props.transcriber.model}
            onChange={(e) => {
              props.transcriber.setModel(e.target.value);
            }}
          >
            {Object.keys(models)
              .filter(
                (key) =>
                  props.transcriber.quantized ||
                  // @ts-ignore
                  models[key].length == 2,
              )
              .filter(
                (key) => (
                  !props.transcriber.multilingual || !key.startsWith('distil-whisper/')
                )
              )
              .map((key) => (
                <option key={key} value={key}>{`${key}${
                  (props.transcriber.multilingual || key.startsWith('distil-whisper/')) ? "" : ".en"
                } (${
                  // @ts-ignore
                  models[key][
                    props.transcriber.quantized ? 0 : 1
                    ]
                }MB)`}</option>
              ))}
          </select>
          <div className='flex justify-between items-center mb-3 px-1'>
            <div className='flex'>
              <input
                id='multilingual'
                type='checkbox'
                checked={props.transcriber.multilingual}
                onChange={(e) => {
                  props.transcriber.setMultilingual(
                    e.target.checked,
                  );
                }}
              ></input>
              <label htmlFor={"multilingual"} className='ms-1'>
                Multilingual
              </label>
            </div>
            <div className='flex'>
              <input
                id='quantize'
                type='checkbox'
                checked={props.transcriber.quantized}
                onChange={(e) => {
                  props.transcriber.setQuantized(
                    e.target.checked,
                  );
                }}
              ></input>
              <label htmlFor={"quantize"} className='ms-1'>
                Quantized
              </label>
            </div>
          </div>
          {props.transcriber.multilingual && (
            <>
              <label>Select the source language.</label>
              <select
                className='mt-1 mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                defaultValue={props.transcriber.language}
                onChange={(e) => {
                  props.transcriber.setLanguage(
                    e.target.value,
                  );
                }}
              >
                {Object.keys(LANGUAGES).map((key, i) => (
                  <option key={key} value={key}>
                    {names[i]}
                  </option>
                ))}
              </select>
              <label>Select the task to perform.</label>
              <select
                className='mt-1 mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                defaultValue={props.transcriber.subtask}
                onChange={(e) => {
                  props.transcriber.setSubtask(
                    e.target.value,
                  );
                }}
              >
                <option value={"transcribe"}>Transcribe</option>
                <option value={"translate"}>
                  Translate (to English)
                </option>
              </select>
            </>
          )}
        </>
      }
      onClose={props.onClose}
      onSubmit={() => {}}
    />
  );
}