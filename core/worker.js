/* eslint-disable camelcase */
// 导入Transformers.js库，用于在浏览器中运行机器学习模型
import { pipeline, env } from "@xenova/transformers";

// 禁用本地模型，强制从远程加载，确保安全性
env.allowLocalModels = false;

/**
 * PipelineFactory 基类
 * 用于创建和管理机器学习管道实例的工厂模式实现
 * 确保每种类型的模型只创建一个实例，节省内存资源
 */
class PipelineFactory {
  // 静态属性，用于存储模型配置
  static task = null;        // 任务类型（如语音识别）
  static model = null;       // 模型名称
  static quantized = null;   // 是否使用量化模型
  static instance = null;    // 单例实例

  constructor(tokenizer, model, quantized) {
    this.tokenizer = tokenizer;
    this.model = model;
    this.quantized = quantized;
  }

  /**
   * 获取单例实例
   * 如果实例不存在则创建新实例，否则返回现有实例
   * @param {Function} progress_callback - 进度回调函数
   * @returns {Promise} 返回模型管道实例的Promise
   */
  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      // 创建新的管道实例
      this.instance = pipeline(this.task, this.model, {
        quantized: this.quantized,      // 是否使用量化模型（减少内存占用）
        progress_callback,              // 下载模型时的进度回调

        // 对于medium模型，使用no_attentions修订版以避免内存不足
        revision: this.model.includes("/whisper-medium") ? "no_attentions" : "main"
      });
    }

    return this.instance;
  }
}

/**
 * Web Worker消息监听器
 * 监听主线程发送的消息并执行相应操作
 * 主要用于接收音频数据并执行语音转文字任务
 */
self.addEventListener("message", async (event) => {
  const message = event.data;

  // 根据消息数据执行语音转文字
  let transcript = await transcribe(
    message.audio,         // 音频数据
    message.model,         // 模型名称
    message.multilingual,  // 是否支持多语言
    message.quantized,     // 是否使用量化模型
    message.subtask,       // 子任务类型（如transcribe或translate）
    message.language,      // 目标语言
  );

  // 如果转录失败，直接返回
  if (transcript === null) return;

  // 将结果发送回主线程
  self.postMessage({
    status: "complete",                    // 状态：完成
    task: "automatic-speech-recognition",  // 任务类型
    data: transcript,                      // 转录结果
  });
});

/**
 * 自动语音识别管道工厂类
 * 继承自PipelineFactory，专门用于语音识别任务
 */
class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
  static task = "automatic-speech-recognition";  // 任务类型：自动语音识别
  static model = null;                          // 模型名称
  static quantized = null;                      // 是否使用量化模型
}

/**
 * 语音转文字主函数
 * 使用Whisper模型将音频转换为文字，并包含时间戳信息
 *
 * @param {ArrayBuffer|Float32Array} audio - 音频数据
 * @param {string} model - 使用的模型名称（如"openai/whisper-base"）
 * @param {boolean} multilingual - 是否启用多语言支持
 * @param {boolean} quantized - 是否使用量化模型
 * @param {string} subtask - 子任务（"transcribe" 或 "translate"）
 * @param {string} language - 语言代码（如"en", "zh"等）
 * @returns {Promise<Object>} 返回转录结果的Promise
 */
const transcribe = async (
  audio,
  model,
  multilingual,
  quantized,
  subtask,
  language,
) => {
  // 检测是否为Distil-Whisper模型（轻量级版本）
  const isDistilWhisper = model.startsWith("distil-whisper/");

  // 根据是否为多语言模型确定模型名称
  // 英语专用模型会在名称后加上".en"后缀
  let modelName = model;
  if (!isDistilWhisper && !multilingual) {
    modelName += ".en"  // 使用英语专用模型
  }

  // 获取语音识别管道工厂实例
  const p = AutomaticSpeechRecognitionPipelineFactory;

  // 如果模型或量化参数发生变化，则销毁旧实例并创建新实例
  if (p.model !== modelName || p.quantized !== quantized) {
    // 更新模型配置
    p.model = modelName;
    p.quantized = quantized;

    // 如果已有实例，则释放资源
    if (p.instance !== null) {
      (await p.getInstance()).dispose();
      p.instance = null;
    }
  }

  // 加载语音转文字模型
  let transcriber = await p.getInstance((data) => {
    // 通过Web Worker向主线程发送进度更新
    self.postMessage(data);
  });

  // 计算时间精度，用于时间戳的准确计算
  const time_precision =
    transcriber.processor.feature_extractor.config.chunk_length /
    transcriber.model.config.max_source_positions;

  // 存储待处理的音频块，初始化为空块
  let chunks_to_process = [
    {
      tokens: [],           // 令牌数组
      finalised: false,     // 是否已完成处理
    },
  ];

  // TODO: 存储完全处理和合并的块
  // let decoded_chunks = [];

  /**
   * 块处理回调函数
   * 每当一个音频块处理完成时调用
   * @param {Object} chunk - 处理完成的音频块
   */
  function chunk_callback(chunk) {
    let last = chunks_to_process[chunks_to_process.length - 1];

    // 用新信息覆盖最后一个块
    Object.assign(last, chunk);
    last.finalised = true;

    // 如果不是最后一个块，则创建一个新块
    if (!chunk.is_last) {
      chunks_to_process.push({
        tokens: [],
        finalised: false,
      });
    }
  }

  /**
   * 生成步骤回调函数
   * 每次生成步骤完成后调用，用于实时更新转录结果
   * @param {Array} item - 生成的项目数组
   */
  function callback_function(item) {
    let last = chunks_to_process[chunks_to_process.length - 1];

    // 更新最后块的令牌
    last.tokens = [...item[0].output_token_ids];

    // 合并文本块
    // TODO: 优化性能，避免每次都解码所有块
    let data = transcriber.tokenizer._decode_asr(chunks_to_process, {
      time_precision: time_precision,      // 时间精度
      return_timestamps: true,             // 返回时间戳
      force_full_sequences: false,         // 不强制完整序列
    });

    // 发送中间结果到主线程
    self.postMessage({
      status: "update",                    // 状态：更新中
      task: "automatic-speech-recognition", // 任务类型
      data: data,                          // 中间转录结果
    });
  }

  // 执行实际的语音转文字处理
  let output = await transcriber(audio, {
    // 解码策略：贪心算法
    top_k: 0,              // 不使用top-k采样
    do_sample: false,      // 不进行随机采样

    // 滑动窗口参数
    chunk_length_s: isDistilWhisper ? 20 : 30,  // 块长度（DistilWhisper使用20秒，其他使用30秒）
    stride_length_s: isDistilWhisper ? 3 : 5,   // 步幅长度（重叠部分）

    // 语言和任务设置
    language: language,     // 目标语言
    task: subtask,          // 子任务类型

    // 时间戳设置
    return_timestamps: true,        // 返回时间戳
    force_full_sequences: false,    // 不强制完整序列

    // 回调函数
    callback_function: callback_function,  // 每个生成步骤后的回调
    chunk_callback: chunk_callback,        // 每个音频块处理后的回调
  }).catch((error) => {
    // 错误处理：发送错误信息到主线程
    self.postMessage({
      status: "error",                     // 状态：错误
      task: "automatic-speech-recognition", // 任务类型
      data: error,                         // 错误详情
    });
    return null;
  });

  return output;
};